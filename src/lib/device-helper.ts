export const saveDeviceId = (deviceId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('spotify_device_id', deviceId);
    console.log('ID del dispositivo guardado:', deviceId);
  }
};

export const getDeviceId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('spotify_device_id');
  }
  return null;
};

export const activateDevice = async (deviceId: string, accessToken: string): Promise<boolean> => {
  const lastActivation = localStorage.getItem('last_device_activation');
  const now = Date.now();
  
  if (lastActivation) {
    const timeSinceLastActivation = now - parseInt(lastActivation, 10);
    if (timeSinceLastActivation < 10000) {
      console.log('Omitiendo activación de dispositivo (activado recientemente)');
      return true;
    }
  }
  
  try {
    localStorage.setItem('last_device_activation', now.toString());
    
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false
      })
    });
    
    if (response.status === 204) {
      console.log('Dispositivo activado correctamente:', deviceId);
      return true;
    } else if (response.status === 429) {
      console.log('Límite de tasa excedido al activar dispositivo. Esto no afecta la funcionalidad.');
      return true;
    } else {
      console.error('Error al activar el dispositivo:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error al activar el dispositivo:', error);
    return false;
  }
};