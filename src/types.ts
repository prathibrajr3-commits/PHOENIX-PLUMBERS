export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'client' | 'admin';
}

export interface Booking {
  id?: string;
  uid: string;
  serviceType: string;
  address: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

export interface Review {
  id?: string;
  uid: string;
  displayName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

