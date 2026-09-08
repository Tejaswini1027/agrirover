import { createContext, useContext } from 'react';

export const NavContext = createContext({ goTo: () => {} });
export const useNav = () => useContext(NavContext);
