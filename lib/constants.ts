export const isProductionEnvironment = process.env.NODE_ENV === 'production';

export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const EMAIL_TO_PATIENT_ID_MAPPING : Record<string,string> = {
  "SampleUser1@gatech.edu": "1091",
  "SampleUser2@gatech.edu": "32063",
  "SampleUser3@gatech.edu": "70261",
  "example@gatech.edu": "example",
}