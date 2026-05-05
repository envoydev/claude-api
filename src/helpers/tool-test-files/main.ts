function calculatePi(): number {
  // Using the Machin formula: pi = 16*arctan(1/5) - 4*arctan(1/239)
  // This converges quickly and gives us pi to the 5th digit

  const arctan = (x: number, numTerms: number): number => {
    let power = x;
    let result = power;
    for (let i = 1; i < numTerms; i++) {
      power *= -x * x;
      result += power / (2 * i + 1);
    }
    return result;
  };

  const pi = 16 * arctan(1 / 5, 50) - 4 * arctan(1 / 239, 50);
  return pi;
}

function main() {
  console.log('Hello, world!');
  const pi = calculatePi();
  console.log(`Pi to 5th digit: ${pi.toFixed(5)}`);
}
