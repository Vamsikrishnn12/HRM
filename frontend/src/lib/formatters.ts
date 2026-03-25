export const formatInrCurrency = (value: number): string =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
