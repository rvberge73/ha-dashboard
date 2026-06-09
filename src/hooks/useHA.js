import { useState, useEffect, useRef } from 'react';
import { subscribeEntities } from 'home-assistant-js-websocket';
import { connectHA } from '../ha';

export function useHA() {
  const [connection, setConnection] = useState(null);
  const [entities, setEntities] = useState({});
  const [areas, setAreas] = useState([]);
  const [deviceRegistry, setDeviceRegistry] = useState([]);
  const [entityRegistry, setEntityRegistry] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // We use a ref to store the connection so it doesn't close on re-renders
  const connRef = useRef(null);

  useEffect(() => {
    let unsubEntities;
    
    connectHA()
      .then(async (conn) => {
        setConnection(conn);
        connRef.current = conn;
        
        try {
          // Haal de 'Areas' (ruimtes) en registry op om te bepalen welk apparaat in welke ruimte staat
          const fetchedAreas = await conn.sendMessagePromise({ type: 'config/area_registry/list' });
          const fetchedDevices = await conn.sendMessagePromise({ type: 'config/device_registry/list' });
          const fetchedEntities = await conn.sendMessagePromise({ type: 'config/entity_registry/list' });
          
          setAreas(fetchedAreas);
          setDeviceRegistry(fetchedDevices);
          setEntityRegistry(fetchedEntities);
        } catch (regErr) {
          console.error("Kon de ruimtes niet ophalen:", regErr);
        }

        // Subscribe to all entity updates
        unsubEntities = subscribeEntities(conn, (ent) => {
          setEntities(ent);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error("HA Connection Error:", err);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      if (unsubEntities) unsubEntities();
    };
  }, []);

  const callService = async (domain, service, serviceData) => {
    if (!connRef.current) return;
    try {
      await connRef.current.sendMessagePromise({
        type: "call_service",
        domain,
        service,
        service_data: serviceData,
      });
    } catch (err) {
      console.error(`Error calling service ${domain}.${service}:`, err);
    }
  };

  return { connection, entities, areas, deviceRegistry, entityRegistry, error, loading, callService };
}
