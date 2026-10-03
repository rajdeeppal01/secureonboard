import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { makeApi } from "./api";

export function useApi() {
  const { getToken } = useAuth();
  
  const api = useMemo(() => {
    return {
      ...makeApi(""), // The actual token must be resolved async
      
      // We wrap every method to automatically resolve the token first
      getStats: async () => makeApi(await getToken()).getStats(),
      getAuditEvents: async (params?: any) => makeApi(await getToken()).getAuditEvents(params),
      getEmployees: async () => makeApi(await getToken()).getEmployees(),
      createEmployee: async (data: any) => makeApi(await getToken()).createEmployee(data),
      deleteEmployee: async (id: string) => makeApi(await getToken()).deleteEmployee(id),
      getIntegrations: async () => makeApi(await getToken()).getIntegrations(),
      connectIntegration: async (type: string, name: string, accessToken: string) => makeApi(await getToken()).connectIntegration(type, name, accessToken),
      disconnectIntegration: async (id: string) => makeApi(await getToken()).disconnectIntegration(id),
      testIntegration: async (id: string) => makeApi(await getToken()).testIntegration(id),
      triggerOffboard: async (email: string) => makeApi(await getToken()).triggerOffboard(email),
      health: async () => makeApi(await getToken()).health(),
      
      // For CSV export URL, we just return the URL, but it can't easily do Authorization header in an <a> tag.
      // We'll pass the token as a query param for the export endpoint.
      exportAuditCsvUrl: async () => {
        const token = await getToken();
        return `${makeApi(token).exportAuditCsvUrl()}&token=${token}`;
      }
    };
  }, [getToken]);

  return api;
}
