/**
 * Pages on the public CompanyFlow website that the app links to. companyflow.dk uses
 * Danish paths (/kontakt/, /ekstra-haandboger/); the English ones from the old staging
 * site (/contact-us/, /extra-handbook/) don't exist there.
 */
const SITE = 'https://companyflow.dk';

export const marketingLinks = {
  contact: `${SITE}/kontakt/`,
  extraHandbook: `${SITE}/ekstra-haandboger/`,
  whistleblower: `${SITE}/whistleblowerordning/`,
} as const;
