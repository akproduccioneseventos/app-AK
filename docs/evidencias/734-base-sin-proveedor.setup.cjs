// Las suites usan sus propios adaptadores atomicos. Ningun SDK se inicia en segundo plano.
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
