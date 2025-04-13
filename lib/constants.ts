export const isProductionEnvironment = process.env.NODE_ENV === 'production';

export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const EMAIL_TO_PATIENT_ID_MAPPING : Record<string,string> = {
  "SampleUser1@gatech.edu": "35684539-cfec-214b-3453-c41aa47abeda",
  "SampleUser2@gatech.edu": "615e4a5f-917b-38c3-ce75-fad3091b2c50",
  "SampleUser3@gatech.edu": "7d38c404-6785-9e9a-3c57-aef08c66cd5d",
  "example@gatech.edu": "example",
}