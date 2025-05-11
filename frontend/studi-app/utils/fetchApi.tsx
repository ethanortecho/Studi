
import React from 'react';
import { useEffect, useMemo, useState } from 'react';


export default function useAggregateData(time_frame: string, 
    start_date: string, 
    end_date?: string
  ) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    
    

    
    useEffect(() => {
        
        const fetchData = async() => {
            const headers =  {
                'Authorization': `Basic ${btoa('ethanortecho:EthanVer2010!')}`
                }
            try{
                console.log('Making API request...');

                let response;
                
                if (time_frame === 'daily') {
                    response = await fetch(`http://127.0.0.1:8000/api/insights/${time_frame}/?date=${start_date}&username=testuser`, {
                        headers: headers
                        })}
                else { 
                    response = await fetch(`http://127.0.0.1:8000/api/insights/${time_frame}/?start_date=${start_date}&end_date=${end_date}&username=testuser`, {
                        headers: headers
                        });

                }
                console.log('Response received:', response.status);
                const json = await response.json();
                setData(json);
                console.log('API Response Structure:', JSON.stringify(json, null, 2));
                setLoading(false);
            
                
            
                }
            catch (error) {
                console.error('Error fetching data:', error);
            }    
            }
            fetchData();

        },[time_frame, start_date, end_date]);
        
    
        return { data, loading };
}