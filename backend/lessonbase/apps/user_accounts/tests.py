from backend.tests import BaseTestCase


class SetUpTestCase(BaseTestCase):

    def setUp(self):
        super().setUp()

    def test_setup_runs(self):
        self.assertIsNotNone(self.teacher)

    def test_teacher_has_students(self):
        self.assertIn(self.student, self.teacher.students.all())

    def test_teacher_cannot_add_self_as_student(self):
        with self.assertRaises(TypeError):
            self.teacher.students.add(self.teacher)
