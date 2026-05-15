import { View, StyleSheet } from 'react-native';
import OrdersList from '../../components/orders/OrdersList';


export default function MyTrips() {
  return (
    <View style={styles.container}>
      <OrdersList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F1F1' },
})