import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { 
  useGetAttributeValueByIdQuery, 
  useFilteringAttributesQuery, 
  AttributeFilterFragment 
} from '../../saleor/api.generated';
import { Text } from '../../components/Themed';
import { EllipsisLoader } from '../../components/EllipsisLoader';
import { FilteredProductList } from '../../components/products/FilteredProductList';
import { mapEdgesToItems } from '../../utils/maps';

export default function ResultsScreen() {
  const { origin, destination, date } = useLocalSearchParams<{ 
    origin: string; 
    destination: string; 
    date: string 
  }>();

  // 1. Fetch Origin Data
  const { data: originRes, loading: loadingO } = useGetAttributeValueByIdQuery({
    variables: { id: origin },
    skip: !origin
  });

  // 2. Fetch Destination Data
  const { data: destinationRes, loading: loadingD } = useGetAttributeValueByIdQuery({
    variables: { id: destination },
    skip: !destination
  });

  // 3. Fetch All Filterable Attributes (Same as transformAttributes.ts)
  const { data: attributesRes, loading: loadingA } = useFilteringAttributesQuery({
    variables: { 
      channel: "ci", 
      filter: { filterableInStorefront: true } 
    }
  });

  const originData = originRes?.attributeValue;
  const destinationData = destinationRes?.attributeValue;

  // 4. Replicate getTransformedAttributes logic
  const transformedAttributes = useMemo(() => {
    if (!attributesRes?.attributes || !originData || !destinationData) return [];

    let attributes: AttributeFilterFragment[] = mapEdgesToItems(attributesRes.attributes);
    
    // Filter out attributes with no choices
    attributes = attributes.filter((attr) => attr.choices?.edges.length);

    // Refine station attributes based on slugs (Logic from your Next.js file)
    return attributes.map((attr): AttributeFilterFragment => {
      if (attr.slug === "departure-station") {
        const filteredEdges = attr.choices?.edges.filter(
          (edge) => edge.node.slug?.includes(originData.slug || "")
        ) ?? [];

        return { ...attr, choices: { ...attr.choices!, edges: filteredEdges } };
      }

      if (attr.slug === "arrival-station") {
        const filteredEdges = attr.choices?.edges.filter(
          (edge) => edge.node.slug?.includes(destinationData.slug || "")
        ) ?? [];

        return { ...attr, choices: { ...attr.choices!, edges: filteredEdges } };
      }

      return attr;
    });
  }, [attributesRes, originData, destinationData]);

  if (loadingO || loadingD || loadingA) {
    return (
      <View style={styles.container}>
        <View style={styles.topBarLoader}>
          <EllipsisLoader color="#EB1700" />
        </View>
        <View style={styles.center}>
          <Text style={{ marginTop: 10, fontFamily: "TTNormsPro-Regular", color: "#606060" }}>Préparation de vos trajets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilteredProductList
        attributeFiltersData={transformedAttributes}
        originData={originData}
        destinationData={destinationData}
        selectedDate={date}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBarLoader: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#D7D8DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});