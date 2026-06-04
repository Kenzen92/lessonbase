// Helpers for displaying tags now that subject is a tag rather than a FK.

/**
 * Pick the most representative tag for compact displays (icon, single chip):
 * the first subject-kind tag, else the first tag, else null.
 */
export const primaryTag = (obj) => {
  const tags = obj?.tags || [];
  return tags.find((t) => t.kind === "subject") || tags[0] || null;
};

export const tagList = (obj) => obj?.tags || [];
