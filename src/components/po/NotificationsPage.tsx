import React, { useEffect, useRef, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { subscribeAuthAndRole } from '../../lib/auth';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Bell, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthAndRole((authUser, userRole) => {
      setUser(authUser);
      setRole(userRole || '');
      
      if (!authUser) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Simple query - just get notifications for this user
      let q;
      if (userRole === 'buyer') {
        q = query(
          collection(db, 'notifications'),
          where('toUserUid', '==', authUser.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'notifications'), 
          where('forRole', '==', userRole),
          orderBy('createdAt', 'desc')
        );
      }

      const unsubscribeQuery = onSnapshot(q, 
        (snapshot) => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setItems(notifications);
          setLoading(false);
        },
        (error) => {
          console.error('Notifications error:', error);
          setLoading(false);
        }
      );

      return unsubscribeQuery;
    });

    return unsubscribe;
  }, []);

  // สร้าง test notification
  const createTestNotification = async () => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'Test Notification',
        message: 'ทดสอบการแจ้งเตือน',
        toUserUid: user.uid,
        forRole: role,
        read: false,
        createdAt: serverTimestamp(),
        orderNo: 123
      });
      alert('สร้าง test notification แล้ว!');
    } catch (error) {
      console.error('Error:', error);
      alert('สร้างไม่ได้: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">การแจ้งเตือน</h2>
        <p className="text-sm text-gray-600">
          User: {user?.email} | Role: {role} | จำนวน: {items.length}
        </p>
        
        <button 
          onClick={createTestNotification}
          className="btn btn-primary btn-sm mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          สร้าง Test Notification
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">ไม่มีการแจ้งเตือน</h3>
          <p className="text-gray-600 mb-4">ลองกดปุ่ม "สร้าง Test Notification" ด้านบน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card bg-white shadow border">
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.title}
                    </h3>
                    {item.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.message}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      ID: {item.id} | Order: #{item.orderNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {item.createdAt?.toDate?.()?.toLocaleString('th-TH') || 'ไม่มีวันที่'}
                    </div>
                    {!item.read && (
                      <span className="badge badge-primary badge-xs mt-1">ใหม่</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}