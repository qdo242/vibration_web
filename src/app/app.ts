import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { VibrationService } from './service/vibration';

// Đăng ký các module của Chart.js để vẽ đồ thị
Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './app.html', // Đảm bảo tên file này khớp với file HTML của bạn
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  // Inject service để giao tiếp với Backend
  private vibrationService = inject(VibrationService);

  // Đối tượng quản lý biểu đồ
  public timeChart: any;
  public fftChart: any;

  // Biến trạng thái hệ thống
  public isAuto: boolean = true;

  ngOnInit() {
    // 1. Khởi tạo cấu hình cho 2 biểu đồ
    this.initCharts();

    // 2. Kết nối WebSocket và bắt đầu hứng dữ liệu từ Backend
    this.vibrationService.connectWebSocket((data: any) => {
      if (data) {
        this.updateCharts(data);
      }
    });
  }

  // Cấu hình ban đầu cho biểu đồ (Miền thời gian & Tần số)
  initCharts() {
    const commonOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 }, // Tắt animation để đồ thị nhảy mượt hơn
      elements: { point: { radius: 0 } }, // Không vẽ điểm để giảm tải CPU
      scales: {
        x: { ticks: { color: '#94a3b8', maxRotation: 0 } },
        y: { ticks: { color: '#94a3b8' } }
      },
      plugins: { legend: { display: false } }
    };

    // Khởi tạo đồ thị Miền Thời Gian
    this.timeChart = new Chart('timeChart', {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Gia tốc (m/s²)',
          data: [],
          borderColor: '#38bdf8',
          borderWidth: 1.5,
          fill: true,
          backgroundColor: 'rgba(56, 189, 248, 0.1)'
        }]
      },
      options: commonOptions
    });

    // Khởi tạo đồ thị Miền Tần Số (FFT)
    this.fftChart = new Chart('fftChart', {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Biên độ',
          data: [],
          borderColor: '#fb7185',
          borderWidth: 1.5,
          fill: true,
          backgroundColor: 'rgba(251, 113, 133, 0.1)'
        }]
      },
      options: commonOptions
    });
  }

  // Cập nhật dữ liệu từ Backend vào biểu đồ
  updateCharts(data: any) {
    // Cập nhật đồ thị thời gian: labels là số thứ tự mẫu, data là mảng time
    this.timeChart.data.labels = data.time.map((_: any, i: number) => i);
    this.timeChart.data.datasets[0].data = data.time;

    // Cập nhật đồ thị FFT: labels là Hz, data là amp (biên độ)
    this.fftChart.data.labels = data.freq.map((f: number) => f.toFixed(1));
    this.fftChart.data.datasets[0].data = data.amp;

    // Lệnh vẽ lại biểu đồ ngay lập tức
    this.timeChart.update('none');
    this.fftChart.update('none');
  }

  /**
   * CÁC HÀM XỬ LÝ SỰ KIỆN (Click Events)
   */

 
  onMeasure() {
    console.log('Gửi lệnh: Bắt đầu đo');
    this.vibrationService.sendCommand('START_MEASURE', 'ON').subscribe({
      next: () => console.log('Đã gửi lệnh ON thành công'),
      error: (err) => console.error('Lỗi khi gửi lệnh:', err)
    });
  }

  // 2. Chuyển đổi giữa chế độ Auto và Manual
  onToggleMode() {
    this.isAuto = !this.isAuto;
    const modeValue = this.isAuto ? 'AUTO' : 'MANUAL';
    this.vibrationService.sendCommand('SET_MODE', modeValue).subscribe();
    console.log(`Đã chuyển sang chế độ: ${modeValue}`);
  }

  // 3. Dừng hệ thống và xóa trắng đồ thị
  onReset() {
    console.log('Gửi lệnh: Dừng hệ thống');
    this.vibrationService.sendCommand('STOP', 'ALL').subscribe();
    
    // Xóa dữ liệu cũ trên màn hình
    this.timeChart.data.labels = [];
    this.timeChart.data.datasets[0].data = [];
    this.fftChart.data.labels = [];
    this.fftChart.data.datasets[0].data = [];
    this.timeChart.update();
    this.fftChart.update();
  }

  ngOnDestroy() {
    // Hủy biểu đồ khi thoát trang để tránh rò rỉ bộ nhớ
    if (this.timeChart) this.timeChart.destroy();
    if (this.fftChart) this.fftChart.destroy();
  }
}