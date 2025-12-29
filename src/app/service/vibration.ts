import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Stomp from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({ providedIn: 'root' })
export class VibrationService {
  private api = 'http://localhost:8080/api';
  private ws = 'http://localhost:8080/ws-vibration';

  connectWebSocket(callback: (data: any) => void) {
    const socket = new SockJS(this.ws);
    const client = Stomp.Stomp.over(socket);
    client.connect({}, () => {
      client.subscribe('/topic/live', (msg) => callback(JSON.parse(msg.body)));
    });
  }

  sendCommand(type: string, value: string) {
    return this.http.post(`${this.api}/command`, { type, value });
  }
  constructor(private http: HttpClient) {}
}