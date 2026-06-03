"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCT_BRANDING } from "@/config/branding";
import { HELP_ARTICLES } from "@/config/help";
import { Button, ui } from "@/components/ui";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const categories = Array.from(
    new Set(HELP_ARTICLES.map((a) => a.category))
  );

  const filteredArticles = HELP_ARTICLES.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentArticle = HELP_ARTICLES.find((a) => a.id === selectedArticle);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">{PRODUCT_BRANDING.icon}</span>
            <span className="text-xl font-bold text-emerald-600">
              {PRODUCT_BRANDING.name}
            </span>
          </Link>
          <Link href="/">
            <Button variant="secondary">חזרה לדף הבית</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {!selectedArticle ? (
          <>
            {/* Hero */}
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold text-neutral-900">
                מרכז העזרה של {PRODUCT_BRANDING.name}
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-neutral-600">
                מצאו תשובות לשאלות נפוצות ולמדו איך להפיק את המקסימום מהמערכת
              </p>
            </div>

            {/* Search */}
            <div className="mx-auto mb-12 max-w-2xl">
              <input
                type="text"
                placeholder="חפשו כאן... (לדוגמא: &apos;איך מוסיפים לקוח&apos;)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={ui.input + " text-lg"}
              />
            </div>

            {/* Articles by Category */}
            {searchQuery === "" ? (
              <div className="space-y-12">
                {categories.map((category) => (
                  <div key={category}>
                    <h2 className="mb-6 text-2xl font-bold text-neutral-900">
                      {category}
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {HELP_ARTICLES.filter((a) => a.category === category).map(
                        (article) => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article.id)}
                            className={
                              ui.card +
                              " cursor-pointer p-6 text-right transition-all hover:scale-105 hover:shadow-lg"
                            }
                          >
                            <div className="mb-3 text-4xl">{article.icon}</div>
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {article.title}
                            </h3>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Search Results */
              <div>
                <h2 className="mb-6 text-2xl font-bold text-neutral-900">
                  תוצאות חיפוש ({filteredArticles.length})
                </h2>
                {filteredArticles.length === 0 ? (
                  <div className="rounded-lg bg-neutral-50 p-12 text-center">
                    <div className="mb-4 text-5xl">🔍</div>
                    <p className="text-lg text-neutral-600">
                      לא מצאנו תוצאות ל-&quot;{searchQuery}&quot;
                    </p>
                    <p className="mt-2 text-sm text-neutral-500">
                      נסו מילות חיפוש אחרות או פנו אלינו בצ&apos;אט
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article.id)}
                        className={
                          ui.card +
                          " cursor-pointer p-6 text-right transition-all hover:scale-105 hover:shadow-lg"
                        }
                      >
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          {article.category}
                        </div>
                        <div className="mb-3 text-4xl">{article.icon}</div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {article.title}
                        </h3>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-16 rounded-lg bg-emerald-600 p-8 text-center text-white">
              <h3 className="mb-2 text-2xl font-bold">לא מצאתם את התשובה?</h3>
              <p className="mb-6 text-emerald-100">
                הצוות שלנו כאן לעזור לכם!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={`mailto:${PRODUCT_BRANDING.contact.email}`}
                  className="rounded-lg bg-white px-6 py-3 font-semibold text-emerald-600 transition-all hover:bg-emerald-50"
                >
                  📧 שלחו מייל
                </a>
                <a
                  href={`https://wa.me/${PRODUCT_BRANDING.contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white px-6 py-3 font-semibold text-emerald-600 transition-all hover:bg-emerald-50"
                >
                  💬 ווטסאפ
                </a>
              </div>
            </div>
          </>
        ) : (
          /* Article View */
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => setSelectedArticle(null)}
              className="mb-6 flex items-center gap-2 text-emerald-600 hover:underline"
            >
              ← חזרה לכל המאמרים
            </button>

            <div className={ui.card + " p-8"}>
              <div className="mb-6 flex items-center gap-4">
                <div className="text-5xl">{currentArticle?.icon}</div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {currentArticle?.category}
                  </div>
                  <h1 className="text-3xl font-bold text-neutral-900">
                    {currentArticle?.title}
                  </h1>
                </div>
              </div>

              <div
                className="prose prose-neutral max-w-none"
                dangerouslySetInnerHTML={{
                  __html: currentArticle?.content
                    .split("\n")
                    .map((line) => {
                      if (line.startsWith("# "))
                        return `<h1 class="text-2xl font-bold mb-4">${line.slice(2)}</h1>`;
                      if (line.startsWith("## "))
                        return `<h2 class="text-xl font-semibold mb-3 mt-6">${line.slice(3)}</h2>`;
                      if (line.startsWith("- "))
                        return `<li class="ml-6">${line.slice(2)}</li>`;
                      if (line.match(/^\d+\./))
                        return `<li class="ml-6">${line.slice(line.indexOf(".") + 2)}</li>`;
                      if (line.startsWith("**") && line.endsWith("**"))
                        return `<p class="font-semibold mb-2">${line.slice(2, -2)}</p>`;
                      if (line.trim() === "") return "<br/>";
                      return `<p class="mb-3">${line}</p>`;
                    })
                    .join("") || "",
                }}
              />

              <div className="mt-8 border-t border-neutral-200 pt-6">
                <p className="mb-3 text-sm font-semibold text-neutral-700">
                  המאמר עזר לכם?
                </p>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                    👍 כן
                  </button>
                  <button className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200">
                    👎 לא
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
