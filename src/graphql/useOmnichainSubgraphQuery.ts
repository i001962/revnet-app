import { type TypedDocumentNode } from "@graphql-typed-document-node/core";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import request from "graphql-request";
import { JBChainId } from "juice-sdk-react";
import { SUBGRAPH_URLS } from "./constants";

export function useOmnichainSubgraphQuery<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): UseQueryResult<
  { status: string; value: { response: TResult; chainId: JBChainId } }[]
> {
  return useQuery({
    queryKey: [(document.definitions[0] as any).name.value, variables],
    queryFn: async ({ queryKey }) => {
      return Promise.allSettled(
        Object.entries(SUBGRAPH_URLS).map(async ([chainId, url]) => {
          if (!url) {
            throw new Error("No subgraph url for chain: " + chainId);
          }

          const response = await request(
            url,
            document,
            queryKey[1] ? queryKey[1] : undefined
          );

          return {
            chainId,
            response,
          };
        })
      );
    },
  });
}