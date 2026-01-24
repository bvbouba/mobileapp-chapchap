import { SafeAreaView,StyleSheet } from 'react-native';
import OrdersList from '../../components/orders/OrdersList';


export default function MyTrips() {
  return (
    <SafeAreaView style={styles.container}>
    <OrdersList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
})