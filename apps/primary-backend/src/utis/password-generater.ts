const generator = require("generate-password");

export default function GeneratePassword() {
  const password = generator.generate({
    length: 10,
    numbers: true,
    symbols: true,
    excludeSimilarCharacters: true,
    strict: true,
  });

  return password;
}
