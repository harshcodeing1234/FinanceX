export const getCurrencySymbol = (currency = 'INR') => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '₹';
  }
};

export const formatCurrency = (amount = 0, currency = 'INR') => {
  const symbol = getCurrencySymbol(currency);
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol}${Number(amount || 0).toLocaleString(locale)}`;
};
