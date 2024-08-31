/* eslint-disable camelcase */
import { Client } from 'rechain';
import { isEmpty } from 'ramda';

import { templates } from 'conf/templates';
import { apiGet, apiOriginGet } from 'lib/api';
import { botCheck } from 'lib/botCheck';

import REChainHttpService from './REChain.http.service';

/** templated base agents */
const templatedBaseAAs = templates.reduce(
  (baseAAs: string[], template) => baseAAs.concat(template.baseAAs),
  []
);

const isBot = botCheck();

/**
 * Get Definition of Agent
 * @param doc_url doc url of base_aa
 */
export const getDefinitionData = async (
  doc_url: string
): Promise<IDefinition> => {
  try {
    return apiGet<IDefinition>(doc_url);
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message);
    throw new Error('getDefinitionData error');
  }
};

/**
 * Get Doc url of Agent
 * @param address address or baseAA of agent
 * @param client REChain.js Client
 */
export const getDocUrl = async (
  address: string,
  client: Client
): Promise<string> => {
  try {
    let res;
    if (isBot) {
      res = await REChainHttpService.getDefinition(address);
    } else {
      res = await client.api.getDefinition(address);
    }

    if ('base_aa' in res[1]) {
      let def;

      if (isBot) {
        def = await REChainHttpService.getDefinition(res[1].base_aa);
      } else {
        def = await client.api.getDefinition(res[1].base_aa);
      }

      return def[1].doc_url;
    }
    if ('doc_url' in res[1]) return res[1].doc_url;
    return '';
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message);
    throw new Error('getDocUrl error');
  }
};

/**
 * Get addresses with undefined base_aa
 * @param agentsCache cache of agents
 * @param incomeAddresses incoming addresses data (arg)
 * @returns non-cached addresses
 */
export const getAddressesWithUndefinedBaseAA = (
  agentsCache: Record<string, IAgentCache>,
  incomeAddresses: string[]
): string[] => {
  const cachedAddresses = Object.keys(agentsCache).reduce(
    (addresses: string[], base_aa) =>
      addresses.concat(Object.keys(agentsCache[base_aa].addresses)),
    []
  );
  return incomeAddresses.reduce(
    (addressesWithUndefinedBaseAA: string[], incomeAddress) => {
      if (!cachedAddresses.includes(incomeAddress))
        return addressesWithUndefinedBaseAA.concat(incomeAddress);
      return addressesWithUndefinedBaseAA;
    },
    []
  );
};

/**
 * Get array of addresses with their base_aa
 * @param addresses array of addresses
 * @param client REChain.js Client
 */
export const getAddressesBaseAA = async (
  addresses: string[],
  client: Client
): Promise<IAddressWithBaseAA[]> =>
  Promise.all(
    addresses.map(async (address) => {
      let definition;

      if (isBot) {
        definition = await REChainHttpService.getDefinition(address);
      } else {
        definition = await client.api.getDefinition(address);
      }

      if (Object.hasOwn(definition[1], 'base_aa')) {
        return { address, base_aa: definition[1].base_aa as string };
      }
      return { address, base_aa: address };
    })
  );

/**
 * Get array of templated addresses with their base_aa and undefined asset value
 * @param agentsCache cache of agents
 * @returns array of addresses with their base_aa
 */
export const getTemplatedAddressesWithUndefinedAsset = (
  agentsCache: Record<string, IAgentCache>
): IAddressWithBaseAA[] =>
  Object.keys(agentsCache).reduce((res: IAddressWithBaseAA[], base_aa) => {
    if (templatedBaseAAs.includes(base_aa)) {
      const { addresses } = agentsCache[base_aa];
      Object.keys(addresses).forEach((address) => {
        if (
          !Object.hasOwn(addresses[address], 'assets') ||
          isEmpty(addresses[address].assets)
        ) {
          res.push({ base_aa, address });
        }
      });
    }
    return res;
  }, []);

/**
 * Get info about address` assets from REChain.js
 * @param address Agent`s address
 * @param client REChain.js Client
 * */
const getAssetsInfoForTemplatedAgentsFabric = async (
  address: string,
  client: Client
): Promise<Record<string, string> | undefined> => {
  try {
    let definition;

    if (isBot) {
      definition = await REChainHttpService.getDefinition(address);
    } else {
      definition = await client.api.getDefinition(address);
    }

    if (
      Object.hasOwn(definition[1], 'base_aa') &&
      Object.hasOwn(definition[1], 'params')
    ) {
      const { base_aa, params } = definition[1];

      const found = templates.find((template) =>
        template.baseAAs.includes(base_aa)
      );

      if (found) return found.getTemplateParams({ params, client, address });
    }

    return undefined;
  } catch (e) {
    if (e instanceof Error) throw new Error(e.message);
    throw new Error('getAssetsInfo error');
  }
};

/**
 * Get array of addresses, base_aa and assets values
 * @param addressesWithBaseAA addresses with their base_aa
 * @param client REChain.js Client
 * @returns addresses with defined assets values
 */
export const getAddressesWithTemplatedAssetsValues = async (
  addressesWithBaseAA: IAddressWithBaseAA[],
  client: Client
): Promise<IAddressWithTemplatedAssetInfo[]> =>
  addressesWithBaseAA.reduce(
    async (accu: Promise<IAddressWithTemplatedAssetInfo[]>, current) => {
      const assetsInfo = await getAssetsInfoForTemplatedAgentsFabric(
        current.address,
        client
      );
      const result = await accu;
      if (assetsInfo && !isEmpty(assetsInfo)) {
        return [...result, { ...current, assets: assetsInfo }];
      }

      return result;
    },
    Promise.resolve([])
  );

/** Get array of addresses with their base_aa and asset values
 * @param agentsCache cache of agents
 */
export const getAddressesWithUndefinedSymbols = (
  agentsCache: Record<string, IAgentCache>
): IAddressWithTemplatedAssetEntity[] =>
  Object.keys(agentsCache).reduce(
    (res: IAddressWithTemplatedAssetEntity[], base_aa) => {
      if (templatedBaseAAs.includes(base_aa)) {
        Object.keys(agentsCache[base_aa].addresses).forEach((address) => {
          const { assets = {} } = agentsCache[base_aa].addresses[address];

          const assetsArr = Object.keys(assets).map(
            (asset) => assets[asset].symbol
          );

          if (assetsArr.some((a) => !a)) {
            res.push({ address, base_aa, assets });
          }
        });
      }
      return res;
    },
    []
  );

/**
 * Get array of addresses with their base_aa, asset values and asset symbols
 * @param addresses array of addresses with their base_aa and asset values
 * @param assetsMetaData assets meta data from api
 */
export const getAddressesWithDefinedSymbolsByMeta = (
  addresses: IAddressWithTemplatedAssetEntity[],
  assetsMetaData: Record<string, string>
): IAddressWithTemplatedAssetEntity[] =>
  addresses.reduce((result: IAddressWithTemplatedAssetEntity[], data) => {
    const assetsArr = Object.keys(data.assets).map((key) => ({
      key,
      value: data.assets[key].value,
      symbol: assetsMetaData[data.assets[key].value] || undefined,
    }));
    if (assetsArr.every((a) => a.symbol))
      result.push({
        ...data,
        assets: assetsArr.reduce(
          (assets: Record<string, IAssetEntity>, { key, value, symbol }) =>
            Object.assign(assets, { [key]: { value, symbol } }),
          {}
        ),
      });
    return result;
  }, []);

/**
 * Get symbol of asset
 * @param asset asset value
 * @param client REChain.js Client
 * @returns symbol of asset
 */
export const getSymbol = async (
  asset: string,
  client: Client
): Promise<string> => {
  const registry = client.api.getOfficialTokenRegistryAddress();
  const symbol = await client.api.getSymbolByAsset(registry, asset);
  return symbol;
};

/**
 * Get array of addresses with their base_aa, asset values and asset symbols
 * @param addresses array of addresses with their base_aa and asset values
 * @param client REChain.js Client
 */
export const getAddressesWithDefinedSymbolsByREChain = (
  addresses: IAddressWithTemplatedAssetEntity[],
  client: Client
): Promise<IAddressWithTemplatedAssetEntity[]> =>
  addresses.reduce(
    async (result: Promise<IAddressWithTemplatedAssetEntity[]>, data) => {
      const assetsPromiseArr = Object.keys(data.assets).map(async (key) => ({
        key,
        value: data.assets[key].value,
        symbol: await getSymbol(data.assets[key].value, client),
      }));
      const assetsArr = await Promise.all(assetsPromiseArr);
      const res = await result;
      if (assetsArr.every((a) => a.symbol))
        res.push({
          ...data,
          assets: assetsArr.reduce(
            (assets: Record<string, IAssetEntity>, { key, value, symbol }) =>
              Object.assign(assets, { [key]: { value, symbol } }),
            {}
          ),
        });
      return res;
    },
    Promise.resolve([])
  );

/** Get array of base_aa without definition
 * @param agentsCache cache of agents
 */
export const getBaseAAwithUndefinedDefinition = (
  agentsCache: Record<string, IAgentCache>
): string[] =>
  Object.keys(agentsCache).reduce((result: string[], base_aa) => {
    if (
      !agentsCache[base_aa].definition ||
      isEmpty(agentsCache[base_aa].definition)
    )
      result.push(base_aa);

    return result;
  }, []);

/**
 * Get array of base_aas with their definition
 * @param baseAAs array of base_aa or addresses
 * @param client REChain.js Client
 * @param cors enables cors proxy
 */
export const getBaseAAWithDefinition = async (
  baseAAs: string[],
  client: Client,
  cors = false
): Promise<IBaseAAWithDefinition[]> => {
  const baseAAwithDocUrls = (
    await Promise.all(
      baseAAs.map(async (base_aa) => ({
        base_aa,
        doc_url: await getDocUrl(base_aa, client),
      }))
    )
  ).filter((d) => d.doc_url);

  const uniqDocUrls = [...new Set(baseAAwithDocUrls.map((ba) => ba.doc_url))];

  const settledUniqDefinitions = await Promise.allSettled(
    uniqDocUrls.map(async (doc_url) => ({
      doc_url,
      definition: cors
        ? await apiOriginGet<IDefinition>(doc_url)
        : await getDefinitionData(doc_url),
    }))
  );

  const fullfiledDefinitions = settledUniqDefinitions.reduce(
    (data: { doc_url: string; definition: IDefinition }[], curr) => {
      if (curr.status === 'fulfilled')
        data.push({
          ...curr.value,
          definition: {
            description: curr.value.definition.description,
            homepage_url: curr.value.definition.homepage_url,
            source_url: curr.value.definition.source_url,
          },
        });

      return data;
    },
    []
  );

  return baseAAwithDocUrls.reduce(
    (res: IBaseAAWithDefinition[], { base_aa, doc_url }) => {
      const found = fullfiledDefinitions.find((d) => d.doc_url === doc_url);
      if (found) res.push({ base_aa, definition: found.definition });

      return res;
    },
    []
  );
};
