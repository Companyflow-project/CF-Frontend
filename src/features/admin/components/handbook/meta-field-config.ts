export type MetaWidget = 'input' | 'textarea';

export interface MetaField {
  key: string;
  label: string;
  hint?: string;
  widget?: MetaWidget;
  placeholder?: string;
}

export interface MetaSection {
  title: string;
  description?: string;
  fields: MetaField[];
}

/**
 * Mirrors the Drupal Metatag module field set shown in the admin Meta Tags
 * form. Keys match the standard metatag module identifiers so the JSON blob
 * in node__field_metatag stays compatible with Drupal's own rendering.
 */
export const META_SECTIONS: MetaSection[] = [
  {
    title: 'Basic tags',
    description: 'Simple meta tags.',
    fields: [
      { key: 'title', label: 'Page title', placeholder: '[node:title] | [site:name]',
        hint: "Recommended ≤ 65 characters, including spaces." },
      { key: 'description', label: 'Description', widget: 'textarea', placeholder: '[node:summary]',
        hint: 'Up to 160 characters. Used by search engines in result snippets.' },
      { key: 'abstract', label: 'Summary', widget: 'textarea', placeholder: '[node:summary]',
        hint: 'Preferably 150 characters or less. Abstract/summary of the page.' },
      { key: 'keywords', label: 'Keywords',
        hint: 'A comma-separated list of keywords about the page.' },
    ],
  },
  {
    title: 'Open Graph',
    description:
      "Controls how Facebook, Pinterest, LinkedIn and other social networks interpret this page's content.",
    fields: [
      { key: 'og:determiner', label: 'Determine',
        hint: "The word that appears before the content's title in a sentence." },
      { key: 'og:site_name', label: 'Site name',
        hint: 'A human-readable name for the site, eg. IMDB.' },
      { key: 'og:type', label: 'Content type',
        hint: 'The type of the content, e.g. movie.' },
      { key: 'og:url', label: 'Page URL',
        hint: 'Preferred page location or URL to help eliminate duplicate content for search engines.' },
      { key: 'og:title', label: 'Title', placeholder: '[node:title]',
        hint: 'The title of the content, e.g. The Rock.' },
      { key: 'og:description', label: 'Description', widget: 'textarea', placeholder: '[node:summary]',
        hint: 'A one to two sentence description of the content.' },
      { key: 'og:image', label: 'Picture', placeholder: 'https://…',
        hint: 'URL of an image ≥ 200×200 px (recommended 600×316). PNG, JPEG or GIF.' },
      { key: 'og:video', label: 'Video URL',
        hint: 'URL of a video that represents the content (recommended ≥ 600×316).' },
      { key: 'og:image:url', label: 'Image URL',
        hint: 'Alternative version of og:image. Only one needs to be used.' },
      { key: 'og:image:secure_url', label: 'Image Secure URL',
        hint: 'Secure (HTTPS) URL of the og:image.' },
      { key: 'og:video:secure_url', label: 'Video Secure URL',
        hint: 'Secure (HTTPS) URL of the og:video. Non-HTTPS values will be coerced to HTTPS.' },
      { key: 'og:video:type', label: 'Video type',
        hint: "Should be video/episode, video/movie, video/other or video/tv_show." },
      { key: 'og:image:type', label: 'Image type',
        hint: 'image/gif, image/jpeg or image/png.' },
      { key: 'og:video:width', label: 'Video width' },
      { key: 'og:image:width', label: 'Image width' },
      { key: 'og:image:height', label: 'Image height' },
      { key: 'og:video:height', label: 'Video height' },
      { key: 'og:video:duration', label: 'Video duration (seconds)' },
      { key: 'og:updated_time', label: 'Content modification date & time',
        hint: 'ISO 8601 format.' },
      { key: 'og:image:alt', label: "Image 'everything'",
        hint: 'A description of what is in the image (like alt text).' },
      { key: 'og:latitude', label: 'Latitude' },
      { key: 'og:longitude', label: 'Longitude' },
      { key: 'og:see_also', label: 'See also',
        hint: 'URLs to related content.' },
      { key: 'og:street_address', label: 'Address' },
      { key: 'og:locality', label: 'Location' },
      { key: 'og:region', label: 'Region' },
      { key: 'og:postal_code', label: 'Postal/ZIP code' },
      { key: 'og:country_name', label: 'Country name' },
      { key: 'og:email', label: 'Email address' },
      { key: 'og:phone_number', label: 'Telephone number' },
      { key: 'og:fax_number', label: 'Fax number' },
      { key: 'og:locale', label: 'Location',
        hint: 'The locale tag, in the format language_TERRITORY. Default is en_US.' },
      { key: 'og:locale:alternate', label: 'Alternative locations',
        hint: 'Other locales this content is available in, e.g. fr_FR. Multiple values separated by comma.' },
      { key: 'article:author', label: 'Article author',
        hint: "Link to an article author's Facebook profile." },
      { key: 'article:publisher', label: 'Article publisher',
        hint: "Link to a publisher's Facebook page." },
      { key: 'article:section', label: 'Article section',
        hint: 'The primary section of this website the content belongs to.' },
      { key: 'article:tag', label: 'Article tag(s)',
        hint: 'Appropriate keywords for this content. Multiple values separated by comma.' },
      { key: 'article:published_time', label: 'Article publication date & time',
        hint: 'ISO 8601 format.' },
      { key: 'article:modified_time', label: 'Article modification date & time',
        hint: 'ISO 8601 format.' },
      { key: 'article:expiration_time', label: 'Article expiration date & time',
        hint: 'ISO 8601 format.' },
      { key: 'book:author', label: 'Book author',
        hint: "Link to a book author's Facebook profile." },
      { key: 'book:isbn', label: 'ISBN', hint: "The book's ISBN." },
      { key: 'book:release_date', label: 'Release Date', hint: 'The date the book was released.' },
      { key: 'book:tag', label: 'Book tag(s)',
        hint: 'Appropriate keywords for this content. Multiple values separated by comma.' },
      { key: 'og:audio', label: 'Audio URL',
        hint: 'URL to an audio file that complements this object.' },
      { key: 'og:audio:secure_url', label: 'Audio secure URL',
        hint: 'Secure (HTTPS) URL to an audio file. Non-HTTPS values will be coerced to HTTPS.' },
      { key: 'og:audio:type', label: 'Audio type',
        hint: 'The MIME type of the audio file, e.g. application/mp3.' },
      { key: 'profile:first_name', label: 'First name',
        hint: 'The first name of the person whose profile page this is.' },
      { key: 'profile:last_name', label: 'Surname', hint: "The person's last name." },
      { key: 'profile:gender', label: 'Sex',
        hint: "Any of Facebook's gender values. Initial two: 'male' and 'female'." },
      { key: 'profile:username', label: 'Internal name',
        hint: 'A pseudonym / alias of this person.' },
      { key: 'video:actor', label: 'Actor(s)',
        hint: 'Links to the Facebook profiles for actor(s) that appear in the video. Multiple separated by comma.' },
      { key: 'video:actor:role', label: "Actor's role",
        hint: 'The roles of the actor(s). Multiple separated by comma.' },
      { key: 'video:director', label: 'Director(s)',
        hint: 'Links to the Facebook profiles for director(s) that worked on the video.' },
      { key: 'video:release_date', label: 'Release date', hint: 'The date the video was released.' },
      { key: 'video:series', label: 'Series', hint: 'The TV show this series belongs to.' },
      { key: 'video:tag', label: 'Take words',
        hint: 'Tag words associated with this video. Multiple separated by comma.' },
      { key: 'video:writer', label: 'Scriptwriter(s)',
        hint: 'Links to the Facebook profiles for scriptwriter(s) for the video.' },
    ],
  },
];
