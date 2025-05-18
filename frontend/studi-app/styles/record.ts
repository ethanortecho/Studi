import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const RecordScreenStyles = StyleSheet.create({
    // Container styles
    container: {
        flex: 1,
        padding: 16,
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    headerContainer: {
        width: '100%',
        paddingVertical: 16,
        marginBottom: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc',
    },
    mainContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        width: '80%',
        marginBottom: 30,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
    },
    categoryContainer: {
        width: '80%',
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
    },
    
    // Text styles
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: Colors.light.text,
        textAlign: 'center',
    },
    startButton: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        textAlign: 'center',
    },
    categoryText: {
        fontSize: 14,
        color: Colors.light.text,
        textAlign: 'center',
    },
    
    // Keep other existing styles below
    tabContainer: {
        marginHorizontal:20
    },
    dashboardContainer: {
        gap: 16,
    },
    totalTimeContainer:{
        padding: 16,
        alignItems:'center'
    },
    section: {
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.light.background,
    },
    box: {
        flex: 1,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
        color: Colors.light.text,
    },
    tabRow: {
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        paddingVertical: 5,
    
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
      },
      tab: {
        paddingVertical: 3,
        paddingHorizontal: 16,
        borderRadius: 10,
      },
      activeTab: {
        backgroundColor: '#1DB272',
      },
      tabText: {
        fontSize: 16,
        fontWeight: '500',
      },
      
      


    label: {
        fontSize: 14,
        color: Colors.light.text,
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
    },

    // Chart styles
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    legendContainer: {
        marginTop: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 8,
    },
    legendTextContainer: {
        flex: 1,
    },
    legendText: {
        fontSize: 14,
        fontWeight: '500',
    },
    durationText: {
        fontSize: 12,
        color: Colors.light.text,
        opacity: 0.7,
    },

    // Summary styles
    summarySection: {
        borderRadius: 12,
    },
    subjectSection: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,

    },
    sessionSection: {
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
    },
    statContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        color: Colors.light.text,
        opacity: 0.7,
        marginRight: 8,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '500',
    },
}); 