export const generateInvoiceNumber = () => {
  const date = new Date();
  return `INV-${ date.getFullYear() }${ date.getMonth() + 1 }${ date.getDate() }-${ Date.now().toString().slice(-4) }`;
};
