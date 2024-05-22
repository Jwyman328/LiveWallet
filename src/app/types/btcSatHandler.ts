export enum BtcMetric {
  SATS = 'SATS',
  BTC = 'BTC',
}
export const btcSatHandler = (sats: string, btcMetric: BtcMetric) => {
  if (btcMetric === BtcMetric.BTC) {
    // TODO use big.js
    const satsParsed = parseFloat(sats.replace(/,/g, ''));
    return (satsParsed / 100000000).toFixed(8);
  } else {
    return sats;
  }
};
