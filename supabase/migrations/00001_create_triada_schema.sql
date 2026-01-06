-- =============================================
-- TIPOS ENUM
-- =============================================

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('user', 'teacher', 'admin');

-- Nivel del curso
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Categoría del curso
CREATE TYPE course_category AS ENUM ('psychology', 'therapy', 'intervention', 'research');

-- Estado del curso
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- Estado del pago
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');


-- =============================================
-- TABLA PROFILES
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  phone TEXT,
  credentials JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);


-- =============================================
-- TABLA COURSES
-- =============================================

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  thumbnail_url TEXT,
  video_preview_url TEXT,
  category course_category NOT NULL,
  level course_level DEFAULT 'beginner',
  tags JSONB,
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  duration_hours INTEGER,
  total_lessons INTEGER DEFAULT 0,
  syllabus JSONB,
  requirements JSONB,
  learning_objectives JSONB,
  status course_status DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  enrolled_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_featured ON courses(is_featured);
CREATE INDEX idx_courses_slug ON courses(slug);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are viewable by everyone" 
  ON courses FOR SELECT 
  USING (status = 'published');

CREATE POLICY "Instructors can view own courses" 
  ON courses FOR SELECT 
  USING (auth.uid() = instructor_id);

CREATE POLICY "Teachers can create courses" 
  ON courses FOR INSERT 
  WITH CHECK (
    auth.uid() = instructor_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Instructors can update own courses" 
  ON courses FOR UPDATE 
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete own courses" 
  ON courses FOR DELETE 
  USING (auth.uid() = instructor_id);


-- =============================================
-- TABLA LESSONS
-- =============================================

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  content TEXT,
  duration_minutes INTEGER,
  module_number INTEGER NOT NULL,
  lesson_number INTEGER NOT NULL,
  attachments JSONB,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, module_number, lesson_number)
);

CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, module_number, lesson_number);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preview lessons are viewable by everyone" 
  ON lessons FOR SELECT 
  USING (is_preview = true);


-- =============================================
-- TABLA ENROLLMENTS
-- =============================================

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_status payment_status DEFAULT 'pending',
  payment_amount DECIMAL(10, 2),
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(payment_status);
CREATE INDEX idx_enrollments_stripe_session ON enrollments(stripe_session_id);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments" 
  ON enrollments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments" 
  ON enrollments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" 
  ON enrollments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view course enrollments" 
  ON enrollments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = enrollments.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );


-- Ahora agregar las políticas de lessons que dependen de enrollments
CREATE POLICY "Enrolled users can view course lessons" 
  ON lessons FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.course_id = lessons.course_id 
      AND enrollments.user_id = auth.uid()
      AND enrollments.payment_status = 'completed'
    )
  );

CREATE POLICY "Instructors can manage own course lessons" 
  ON lessons FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = lessons.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );


-- =============================================
-- TABLA LESSON_PROGRESS
-- =============================================

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  last_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" 
  ON lesson_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" 
  ON lesson_progress FOR ALL 
  USING (auth.uid() = user_id);


-- =============================================
-- TABLA COURSE_REVIEWS
-- =============================================

CREATE TABLE course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX idx_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_reviews_user ON course_reviews(user_id);
CREATE INDEX idx_reviews_rating ON course_reviews(rating);

ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" 
  ON course_reviews FOR SELECT 
  USING (true);

CREATE POLICY "Enrolled users can create reviews" 
  ON course_reviews FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.course_id = course_reviews.course_id 
      AND enrollments.user_id = auth.uid()
      AND enrollments.payment_status = 'completed'
    )
  );

CREATE POLICY "Users can update own reviews" 
  ON course_reviews FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" 
  ON course_reviews FOR DELETE 
  USING (auth.uid() = user_id);


-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at BEFORE UPDATE ON course_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE OR REPLACE FUNCTION update_course_enrolled_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.payment_status = 'completed') OR 
     (TG_OP = 'UPDATE' AND OLD.payment_status != 'completed' AND NEW.payment_status = 'completed') THEN
    UPDATE courses 
    SET enrolled_count = enrolled_count + 1 
    WHERE id = NEW.course_id;
  END IF;
  
  IF (TG_OP = 'UPDATE' AND OLD.payment_status = 'completed' AND NEW.payment_status != 'completed') THEN
    UPDATE courses 
    SET enrolled_count = GREATEST(enrolled_count - 1, 0)
    WHERE id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrolled_count_trigger
AFTER INSERT OR UPDATE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_enrolled_count();


CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM course_reviews 
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM course_reviews 
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON course_reviews
FOR EACH ROW EXECUTE FUNCTION update_course_rating();
