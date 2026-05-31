const { slugify } = require('../utils/slugify');

/**
 * Generates a unique slug by appending an incrementing suffix until the checkFn
 * returns false (meaning the slug is not taken).
 *
 * @param {string} name - The source string to slugify
 * @param {(slug: string) => Promise<boolean>} checkFn - Returns true if slug is already taken
 * @returns {Promise<string>}
 */
const generateUniqueSlug = async (name, checkFn) => {
  const base = slugify(name);
  let slug = base;
  let counter = 1;

  while (await checkFn(slug)) {
    slug = `${base}-${counter++}`;
  }

  return slug;
};

module.exports = { generateUniqueSlug };
