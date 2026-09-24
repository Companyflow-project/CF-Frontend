/**
 * Pages on the public CompanyFlow website that the app links to. These used to
 * point at companyflow.digibida.com, a staging copy that is no longer
 * reachable; companyflow.dk serves the same pages at the same paths.
 */
const SITE = 'https://companyflow.dk';

export const marketingLinks = {
  contact: `${SITE}/contact-us/`,
  extraHandbook: `${SITE}/extra-handbook/`,
  whistleblower: `${SITE}/whistleblowerordning/`,
} as const;
