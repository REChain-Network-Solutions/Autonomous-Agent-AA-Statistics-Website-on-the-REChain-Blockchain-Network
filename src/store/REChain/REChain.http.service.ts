import obyte from 'obyte-http-client';

const rechain = obyte;

export default new rechain.Client({
  testnet: false,
  hubAddress: 'https://rechain.network/api',
});
