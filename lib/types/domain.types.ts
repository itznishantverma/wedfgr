export interface Student {
  id: string;
  user_id: string | null;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  date_of_birth: string | null;
  nationality: string | null;
  religion: string | null;
  blood_type: string | null;
  address: string | null;
  profile_photo_url: string | null;
  admission_date: string;
  status: 'active' | 'graduated' | 'transferred' | 'dropped' | 'deceased';
  previous_school: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  user_id: string | null;
  employee_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  date_of_birth: string | null;
  hire_date: string;
  employment_status: 'active' | 'on_leave' | 'resigned' | 'retired' | 'terminated';
  qualification: string | null;
  specialization: string | null;
  department_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  user_id: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  relationship_label: string;
  phone: string | null;
  alternate_phone: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  enrollment_number: string;
  student_id: string;
  class_id: string;
  academic_term_id: string;
  enrollment_date: string;
  status: 'enrolled' | 'dropped' | 'completed' | 'transferred' | 'on_leave';
  roll_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentFilters {
  status?: Student['status'];
  search?: string;
}

export interface TeacherFilters {
  is_active?: boolean;
  department_id?: string;
  employment_status?: Teacher['employment_status'];
  search?: string;
}

export interface ParentFilters {
  is_active?: boolean;
  search?: string;
}

export interface EnrollmentFilters {
  status?: Enrollment['status'];
  class_id?: string;
  academic_term_id?: string;
  student_id?: string;
}

export interface UserFilters {
  is_active?: boolean;
  role_id?: string;
  search?: string;
}
