import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const dashboardStyles = StyleSheet.create({
    // Container styles
    container: {
        flex: 1,
        padding: 16,
    },
    tabContainer: {
        marginHorizontal:20
    },
    dashboardContainer: {
        gap: 16,
    },
    totalTimeContainer:{
        padding: 16 ,
        alignItems:'center'


    },
    
    section: {
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.light.background,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,

    },
    box: {
        flex: 1,
    },

    // Text styles
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: Colors.light.text,
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