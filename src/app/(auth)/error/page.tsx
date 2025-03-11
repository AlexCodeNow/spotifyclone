'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from 'next/image';

export default function ErrorPage() {
  const [errorType, setErrorType] = useState('unknown');
  const [errorMessage, setErrorMessage] = useState('Ocurrió un error inesperado');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const messageParam = urlParams.get('message');

    if (typeParam) {
      setErrorType(typeParam);
    }

    if(messageParam) {
      setErrorMessage(messageParam);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center">
          <Image 
            src="/spotify-logo.png"
            alt="Spotify"
            width={196}
            height={60}
            className="mb-8"
          />

          <h1 className="text-3xl font-bold text-white mb-4">
            Error de autenticación
          </h1>

          <div className="bg-red-500 text-white p-4 rounded-md mb-6">
            <p className="font-medium mb-2">
              {errorType === 'auth_failed' ? 'Error de autenticación' : 
              errorType === 'missing_code' ? 'Código de autorización faltante':
              'Error de conexión'}
            </p>
            <p className="text-sm">{errorMessage}</p>
          </div>
          <p className="text-gray-300 mb-6">
            Por favor, intenta iniciar sesión nuevamente.
          </p>

          <Link
            href="/login"
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition duration-200 block text-center"
            >
              Volver al inicio de sesión
            </Link>

            <p className="text-gray-400 text-sm mt-8">
              Si el problema persiste, asegúrate de que tus credenciales de Spotify sean correctas
            </p>
        </div>
      </div>
    </div>
  );
}