const isProduction = process.env.NODE_ENV === 'production';
export const configs = {
  defaultDescriptor: isProduction
    ? ''
    : 'wpkh(tprv8ZgxMBicQKsPcx5nBGsR63Pe8KnRUqmbJNENAfGftF3yuXoMMoVJJcYeUw5eVkm9WBPjWYt6HMWYJNesB5HaNVBaFc1M6dRjWSYnmewUMYy/84h/0h/0h/0/*)',
  defaultElectrumServerUrl: isProduction ? '' : '127.0.0.1:50000',
  backendServerBaseUrl: 'http://localhost:5011',
};
