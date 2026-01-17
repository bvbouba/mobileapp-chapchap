import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { 
  useProductVariantCollectionQuery, 
  ProductVariantWhereInput, 
  ProductVariantSortField, 
  OrderDirection 
} from '../../saleor/api.generated';
import { mapEdgesToItems } from '../../utils/maps';
import { ProductElement } from './ProductElement';
import { Text } from '../Themed';

interface Props {
  originSlug: string;
  destinationSlug: string;
  date: string;
  where?: ProductVariantWhereInput; // Dynamic filters from SectionFilter
  sortBy?: {
    field: ProductVariantSortField;
    direction: OrderDirection;
  };
  setCounter?: (count: number) => void;
}

export const ProductCollection = ({ 
  originSlug, 
  destinationSlug, 
  date, 
  where, 
  sortBy, 
  setCounter 
}: Props) => {
  
  // 1. Merge hardcoded attributes (cities/date) with dynamic attributes (stations/bus-operator)
  const mergedWhere: ProductVariantWhereInput = {
    ...where,
    attributes: [
      ...(where?.attributes ?? []), // Spread existing dynamic filters
      { slug: "departure-city", value: { slug: { oneOf: [originSlug] } } },
      { slug: "arrival-city", value: { slug: { oneOf: [destinationSlug] } } },
      {
        slug: "departure-time",
        value: {
          dateTime: {
            gte: `${date}T00:00:00`,
            lte: `${date}T23:59:59`,
          },
        },
      },
    ],
  };

  const { data, loading, error, fetchMore } = useProductVariantCollectionQuery({
    variables: {
      where: mergedWhere,
      sortBy: sortBy,
      channel: "ci",
      first: 10, // Pagination per page
    },
    notifyOnNetworkStatusChange: true, // Shows loading spinner during filter updates
  });

  // 2. Sync counter with parent if needed
  useEffect(() => {
    if (setCounter && data?.productVariants?.totalCount !== undefined) {
      setCounter(data.productVariants.totalCount || 0);
    }
  }, [data?.productVariants?.totalCount, setCounter]);

  const variants = mapEdgesToItems(data?.productVariants);

  // Handle Load More (Pagination)
  const handleLoadMore = () => {
    if (data?.productVariants?.pageInfo.hasNextPage) {
      fetchMore({
        variables: {
          after: data.productVariants.pageInfo.endCursor,
        },
      });
    }
  };

  if (loading && !data) return <ActivityIndicator style={styles.loader} color="#E91E63" />;
  
  if (error) return <Text style={styles.error}>Erreur lors du chargement des trajets.</Text>;

  if (variants.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>Aucun trajet trouvé pour cette sélection.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={variants}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductElement variant={item} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? <ActivityIndicator color="#E91E63" style={{ margin: 10 }} /> : null
      }
    />
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
  error: { textAlign: 'center', marginTop: 40, color: 'red' }
});