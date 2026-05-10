import { StyleSheet, View } from "react-native";
import HeroHeader from "./HeroHeader";
import HeroSearch from "./HeroSearch";

const DashboardScreen = () => {
    return (
        <View style={styles.container}>
           <HeroHeader />
           <HeroSearch />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topHalf: {
        flex: 1,
        backgroundColor: '#1a1a1a', // Dark theme matching your web absolute bg
    },
    heroBg: {
        flex: 1,
        width: '150%', // Make the image wider than the screen
        left: 0,      // Pin it to the left
        justifyContent: 'center',
        alignItems: 'flex-start', // Align text to the left if desired
        paddingLeft: 40,
    },
    brandName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    tagline: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 5,
    },
    bottomHalf: {
        flex: 1.2, // Slightly larger for the form
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    searchCard: {
        marginTop: -40, // Pulls the card up into the hero section like your web CSS
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    dateText: {
        fontSize: 16,
        color: '#999',
    },
    searchButton: {
        backgroundColor: '#E91E63', // Use your secondary color from NextJS
        height: 55,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DashboardScreen;