import React from 'react';
import { X, Package, Calendar, User, DollarSign, FileText, Clock } from 'lucide-react';
import type { Order } from '../../lib/poApi';
import { getProcurementStatusDisplay } from '../../lib/poApi';
import { generateOrderNumber } from '../../lib/poApi';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

const getItemTypeColor = (itemType: string) => {
  switch (itemType) {
    case 'วัตถุดิบ':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'เครื่องมือ':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'วัสดุสิ้นเปลือง':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Software':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatTimestamp = (timestamp: any) => {
  if (!timestamp?.toDate) return '-';
  return timestamp.toDate().toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'รออนุมัติ';
    case 'approved': return 'อนุมัติแล้ว';
    case 'rejected': return 'ไม่อนุมัติ';
    case 'in_progress': return 'กำลังดำเนินการ';
    case 'delivered': return 'ได้รับแล้ว';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'delivered': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};


export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  const timestamps = order.timestamps || {};
  const itemTypeStats = order.items?.reduce((acc, item) => {
    const type = item.itemType || 'วัตถุดิบ';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {generateOrderNumber(order.orderNo, order.date)}
              </h2>
              <p className="text-sm text-gray-600">
                รายละเอียดใบสั่งซื้อ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">ผู้ขอซื้อ</span>
              </div>
              <p className="font-semibold text-gray-900">{order.requester}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">วันที่สร้าง</span>
              </div>
              <p className="font-semibold text-gray-900">{order.date}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">ยอดรวม</span>
              </div>
              <p className="font-semibold text-gray-900">
                {order.totalAmount?.toLocaleString('th-TH') || 0} บาท
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">สถานะ</span>
              </div>
              <div className="space-y-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
                {order.procurementStatus && (
                  <div className="text-xs text-blue-600 font-medium">
                    ฝ่ายจัดซื้อ: {getProcurementStatusDisplay(order.procurementStatus)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {Object.keys(itemTypeStats).length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                สรุปประเภทสินค้า
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(itemTypeStats).map(([type, count]) => (
                  <span key={type} className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getItemTypeColor(type)}`}>
                    {type}: {count} รายการ
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ไทม์ไลน์การดำเนินงาน
            </h3>
            <div className="space-y-3">
              {timestamps.submitted && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-gray-700">📝 ส่งคำขอซื้อ</span>
                  </div>
                  <span className="text-sm text-gray-600">{formatTimestamp(timestamps.submitted)}</span>
                </div>
              )}
              {timestamps.approved && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-700">✅ อนุมัติแล้ว</span>
                  </div>
                  <span className="text-sm text-green-600">{formatTimestamp(timestamps.approved)}</span>
                </div>
              )}
              {timestamps.rejected && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-700">❌ ไม่อนุมัติ</span>
                  </div>
                  <span className="text-sm text-red-600">{formatTimestamp(timestamps.rejected)}</span>
                </div>
              )}
              {timestamps.procurementStarted && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-purple-700">🛒 เริ่มจัดซื้อ</span>
                  </div>
                  <span className="text-sm text-purple-600">{formatTimestamp(timestamps.procurementStarted)}</span>
                </div>
              )}
              {timestamps.procurementUpdated && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-blue-700">🔄 อัปเดตสถานะ</span>
                  </div>
                  <span className="text-sm text-blue-600">{formatTimestamp(timestamps.procurementUpdated)}</span>
                </div>
              )}
              {timestamps.delivered && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-700">📦 ส่งมอบแล้ว</span>
                  </div>
                  <span className="text-sm text-green-600">{formatTimestamp(timestamps.delivered)}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              รายการสินค้า ({order.items?.length || 0} รายการ)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">ลำดับ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">รายการ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">ประเภท</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">วันที่ต้องการ</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">จำนวน</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">ราคา/หน่วย</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.description}</div>
                        {item.receivedDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            ต้องการรับ: {item.receivedDate}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getItemTypeColor(item.itemType || 'วัตถุดิบ')}`}>
                          {item.itemType || 'วัตถุดิบ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.receivedDate || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{item.quantity?.toLocaleString('th-TH')}</td>
                      <td className="px-4 py-3 text-right">{item.amount?.toLocaleString('th-TH')}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {item.lineTotal?.toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-right font-bold text-gray-900 text-lg">
                      รวมทั้งสิ้น:
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg">
                      {order.totalAmount?.toLocaleString('th-TH') || 0} บาท
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลเพิ่มเติม</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">เลขที่อ้างอิง:</span> {order.id.substring(0, 8)}...
              </div>
              <div>
                <span className="font-medium">จำนวนรายการ:</span> {order.items?.length || 0} รายการ
              </div>
              <div>
                <span className="font-medium">ประเภทหลัก:</span> {order.items?.[0]?.itemType || 'วัตถุดิบ'}
              </div>
              <div>
                <span className="font-medium">ราคาเฉลี่ยต่อรายการ:</span> {
                  order.items?.length > 0 
                    ? Math.round((order.totalAmount || 0) / order.items.length).toLocaleString('th-TH')
                    : 0
                } บาท
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}