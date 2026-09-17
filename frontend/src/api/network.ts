import { apiClient } from './client'
import type { NetworkDevice } from '../types/network'

export async function fetchNetworkDevices(): Promise<NetworkDevice[]> {
  const { data } = await apiClient.get<NetworkDevice[]>('/api/network/devices')
  return data
}
