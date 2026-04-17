import type { Article, SiteConfig } from "@/lib/types";

export interface PublishResult {
  wpPostId: number;
  wpEditUrl: string;
  wpPreviewUrl: string;
}

/**
 * Converts a subset of markdown to basic HTML for WordPress.
 * Handles headings, bold, italic, links, lists, code blocks, and paragraphs.
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Fenced code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Headings (## and ###, no H1)
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/(^- .+(\n- .+)*)/gm, (match) => {
    const items = match
      .split("\n")
      .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
      .join("\n");
    return `<ul>\n${items}\n</ul>`;
  });

  // Ordered lists
  html = html.replace(/(^\d+\. .+(\n\d+\. .+)*)/gm, (match) => {
    const items = match
      .split("\n")
      .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
      .join("\n");
    return `<ol>\n${items}\n</ol>`;
  });

  // Paragraphs: wrap blocks not already wrapped in block elements
  const blockTags = new Set(["<h2", "<h3", "<ul", "<ol", "<pre", "<blockquote"]);
  const lines = html.split(/\n{2,}/);
  html = lines
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (blockTags.has(trimmed.slice(0, 3))) return trimmed;
      return `<p>${trimmed.replace(/\n/g, " ")}</p>`;
    })
    .filter(Boolean)
    .join("\n\n");

  return html;
}

/**
 * Builds the WordPress request body from an Article.
 */
function buildWpPostBody(article: Article): Record<string, unknown> {
  const htmlContent = markdownToHtml(article.markdownContent);

  // Append FAQs as structured HTML if present
  let faqHtml = "";
  if (article.faqs.length > 0) {
    faqHtml =
      "\n\n<div class=\"faqs\">\n" +
      article.faqs
        .map(
          (faq) =>
            `<div class="faq-item"><h3>${faq.question}</h3><p>${faq.answer}</p></div>`,
        )
        .join("\n") +
      "\n</div>";
  }

  return {
    title: article.metadata.title,
    slug: article.metadata.slug,
    content: htmlContent + faqHtml,
    status: "draft",
    excerpt: article.metadata.excerpt,
    // Yoast SEO fields (if Yoast REST API plugin is active)
    meta: {
      _yoast_wpseo_title: article.metadata.seoTitle,
      _yoast_wpseo_metadesc: article.metadata.metaDescription,
      _yoast_wpseo_focuskw: article.metadata.targetKeyword,
    },
  };
}

/**
 * Publisher stage: converts article to HTML and creates a WordPress draft post.
 * Returns the WP post ID plus edit/preview URLs.
 */
export async function executePublisher(
  jobId: string,
  article: Article,
  siteConfig: SiteConfig,
): Promise<PublishResult> {
  console.log(
    `[${jobId}] Publisher stage started for: "${article.metadata.title}"`,
  );

  const { wpBaseUrl, wpUsername, wpAppPassword } = siteConfig;

  if (!wpUsername || !wpAppPassword) {
    throw new Error(
      `[${jobId}] WordPress credentials (wpUsername / wpAppPassword) are not set for site "${siteConfig.slug}"`,
    );
  }

  const apiBase = `${wpBaseUrl.replace(/\/$/, "")}/wp-json/wp/v2`;
  const credentials = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString(
    "base64",
  );
  const headers: HeadersInit = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };

  // Step 1: Create the draft post
  const postBody = buildWpPostBody(article);

  const createRes = await fetch(`${apiBase}/posts`, {
    method: "POST",
    headers,
    body: JSON.stringify(postBody),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(
      `[${jobId}] WordPress create post failed (${createRes.status}): ${errorText}`,
    );
  }

  const created = (await createRes.json()) as {
    id: number;
    link: string;
    guid?: { rendered?: string };
  };

  const wpPostId = created.id;
  const wpEditUrl = `${wpBaseUrl.replace(/\/$/, "")}/wp-admin/post.php?post=${wpPostId}&action=edit`;
  const wpPreviewUrl = `${created.link}?preview=true`;

  // Step 2: Set category if suggested
  if (article.metadata.suggestedCategory) {
    try {
      // Find or create the category
      const catSearchRes = await fetch(
        `${apiBase}/categories?search=${encodeURIComponent(article.metadata.suggestedCategory)}&per_page=1`,
        { headers },
      );

      if (catSearchRes.ok) {
        const cats = (await catSearchRes.json()) as { id: number }[];
        let categoryId: number | undefined = cats[0]?.id;

        if (!categoryId) {
          // Create category
          const catCreateRes = await fetch(`${apiBase}/categories`, {
            method: "POST",
            headers,
            body: JSON.stringify({ name: article.metadata.suggestedCategory }),
          });
          if (catCreateRes.ok) {
            const newCat = (await catCreateRes.json()) as { id: number };
            categoryId = newCat.id;
          }
        }

        if (categoryId) {
          await fetch(`${apiBase}/posts/${wpPostId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ categories: [categoryId] }),
          });
        }
      }
    } catch {
      // Non-fatal: category setting failed, post still created
      console.warn(`[${jobId}] Failed to set category, continuing`);
    }
  }

  // Step 3: Set featured image if URL provided
  if (article.featuredImage?.url) {
    try {
      // Sideload the image into WordPress media library
      const imgRes = await fetch(`${apiBase}/media`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Disposition": `attachment; filename="${article.featuredImage.filename}"`,
          "Content-Type": "image/jpeg",
        },
        body: JSON.stringify({
          source_url: article.featuredImage.url,
          alt_text: article.featuredImage.altText,
        }),
      });

      if (imgRes.ok) {
        const media = (await imgRes.json()) as { id: number };
        await fetch(`${apiBase}/posts/${wpPostId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ featured_media: media.id }),
        });
      }
    } catch {
      // Non-fatal: image setting failed, post still created
      console.warn(`[${jobId}] Failed to set featured image, continuing`);
    }
  }

  console.log(
    `[${jobId}] Publisher stage complete. WP post ID: ${wpPostId}`,
  );

  return { wpPostId, wpEditUrl, wpPreviewUrl };
}
