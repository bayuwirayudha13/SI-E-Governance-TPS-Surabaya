import unittest
from datetime import datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth.dependencies import get_current_user_from_token
from core.database import Base, get_db
from core.security import require_admin, require_petugas_tps, require_superadmin
from models.petugas_tps_assignment import PetugasTPSAssignment
from models.tps import TPS
from models.tps_kelurahan import TPSKelurahan
from models.tps_monitoring_report import TPSMonitoringReport
from models.users import User
from models.warga import Warga
from models.wilayah import Kecamatan, Kelurahan
from routes.petugas_tps_routes import router as petugas_tps_router
from routes.tps_routes import router as tps_router
from routes.admin_routes import (
    get_current_superadmin,
    router as admin_router,
)


class TpsMonitoringWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False)
        self.db = self.SessionLocal()

        self.resident = Warga(
            nama="Warga Bubutan",
            email="warga-bubutan@example.test",
            password_hash="test",
            kecamatan="Bubutan",
            kelurahan="Tembok Dukuh",
        )
        self.petugas = User(
            username="petugas-tps",
            email="petugas-tps@example.test",
            hashed_password="test",
            nama_lengkap="Petugas TPS Test",
            role="petugas_tps",
            is_active=True,
            wilayah_kecamatan="Bubutan",
            wilayah_kelurahan="Tembok Dukuh",
        )
        self.admin = User(
            username="admin",
            email="admin@example.test",
            hashed_password="test",
            nama_lengkap="Admin Test",
            role="admin",
            is_active=True,
        )
        self.superadmin = User(
            username="superadmin",
            email="superadmin@example.test",
            hashed_password="test",
            nama_lengkap="Superadmin Test",
            role="superadmin",
            is_active=True,
        )
        self.db.add_all([
            Kecamatan(nama="Bubutan"),
            Kecamatan(nama="Benowo"),
            Kelurahan(nama="Tembok Dukuh", kecamatan="Bubutan", wilayah_kota="Surabaya"),
            Kelurahan(nama="Romokalisari", kecamatan="Benowo", wilayah_kota="Surabaya"),
            self.resident,
            self.petugas,
            self.admin,
            self.superadmin,
        ])
        self.db.flush()

        self.assigned_tps = TPS(
            nama="TPS Bubutan Assigned",
            lokasi="Tembok Dukuh",
            kecamatan="Bubutan",
            wilayah_kota="Surabaya",
            latitude=-7.25,
            longitude=112.73,
            daya_tampung_m3=10,
            status="Aktif",
        )
        self.unassigned_tps = TPS(
            nama="TPS Bubutan Unassigned",
            lokasi="Bubutan",
            kecamatan="Bubutan",
            wilayah_kota="Surabaya",
            latitude=-7.26,
            longitude=112.74,
            daya_tampung_m3=10,
            status="Aktif",
        )
        self.other_district_tps = TPS(
            nama="TPS Benowo",
            lokasi="Romokalisari",
            kecamatan="Benowo",
            wilayah_kota="Surabaya",
            latitude=-7.24,
            longitude=112.65,
            daya_tampung_m3=10,
            status="Aktif",
        )
        self.inactive_tps = TPS(
            nama="TPS Bubutan Inactive",
            lokasi="Bubutan",
            kecamatan="Bubutan",
            wilayah_kota="Surabaya",
            daya_tampung_m3=10,
            status="Tidak Aktif",
        )
        self.db.add_all([
            self.assigned_tps,
            self.unassigned_tps,
            self.other_district_tps,
            self.inactive_tps,
        ])
        self.db.flush()

        bubutan_kelurahan = self.db.query(Kelurahan).filter(
            Kelurahan.nama == "Tembok Dukuh"
        ).one()
        benowo_kelurahan = self.db.query(Kelurahan).filter(
            Kelurahan.nama == "Romokalisari"
        ).one()
        self.db.add_all([
            TPSKelurahan(tps_id=self.assigned_tps.id, kelurahan_id=bubutan_kelurahan.id),
            TPSKelurahan(tps_id=self.other_district_tps.id, kelurahan_id=benowo_kelurahan.id),
            PetugasTPSAssignment(user_id=self.petugas.id, tps_id=self.assigned_tps.id),
            TPSMonitoringReport(
                petugas_id=self.petugas.id,
                tps_id=self.assigned_tps.id,
                volume_aktual_m3=2,
                persentase_kapasitas=20,
                waktu_monitoring=datetime(2025, 1, 1, 8, 0),
                status_verifikasi="Disetujui",
                diverifikasi_oleh=self.admin.id,
                waktu_verifikasi=datetime(2025, 1, 1, 9, 0),
            ),
            TPSMonitoringReport(
                petugas_id=self.petugas.id,
                tps_id=self.assigned_tps.id,
                volume_aktual_m3=9,
                persentase_kapasitas=90,
                waktu_monitoring=datetime(2025, 1, 2, 8, 0),
                status_verifikasi="Menunggu Verifikasi",
            ),
            TPSMonitoringReport(
                petugas_id=self.petugas.id,
                tps_id=self.assigned_tps.id,
                volume_aktual_m3=8,
                persentase_kapasitas=80,
                waktu_monitoring=datetime(2025, 1, 3, 8, 0),
                status_verifikasi="Ditolak",
            ),
        ])
        self.db.commit()

        app = FastAPI()
        app.include_router(tps_router, prefix="/api")
        app.include_router(petugas_tps_router, prefix="/api")
        app.include_router(admin_router, prefix="/api")

        def override_db():
            session = self.SessionLocal()
            try:
                yield session
            finally:
                session.close()

        app.dependency_overrides[get_db] = override_db
        app.dependency_overrides[get_current_user_from_token] = lambda: {
            "id": self.resident.id,
            "role": "warga",
        }
        app.dependency_overrides[require_petugas_tps] = lambda: self.petugas
        app.dependency_overrides[require_admin] = lambda: self.admin
        app.dependency_overrides[require_superadmin] = lambda: self.superadmin
        app.dependency_overrides[get_current_superadmin] = lambda: self.superadmin
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_only_assigned_petugas_can_report_and_only_approved_data_is_public(self):
        before_approval = self.client.get("/api/tps/warga")
        self.assertEqual(before_approval.status_code, 200)
        before_data = before_approval.json()
        self.assertEqual(
            [tps["id"] for tps in before_data["tps"]],
            [self.assigned_tps.id, self.unassigned_tps.id],
        )
        assigned_before = next(
            tps for tps in before_data["tps"] if tps["id"] == self.assigned_tps.id
        )
        self.assertEqual(assigned_before["persentase_kapasitas"], 20)
        unassigned_before = next(
            tps for tps in before_data["tps"] if tps["id"] == self.unassigned_tps.id
        )
        self.assertIsNone(unassigned_before["persentase_kapasitas"])

        denied = self.client.post(
            "/api/petugas-tps/monitoring-report",
            data={
                "tps_id": str(self.unassigned_tps.id),
                "volume_aktual_m3": "5",
                "persentase_kapasitas": "50",
            },
        )
        self.assertEqual(denied.status_code, 403)

        submitted = self.client.post(
            "/api/petugas-tps/monitoring-report",
            data={
                "tps_id": str(self.assigned_tps.id),
                "volume_aktual_m3": "5",
                "persentase_kapasitas": "50",
                "waktu_monitoring": "2025-01-04T08:00",
            },
        )
        self.assertEqual(submitted.status_code, 201, submitted.text)
        report_id = submitted.json()["report_id"]

        while_pending = self.client.get("/api/tps/warga").json()
        approved_capacity = next(
            tps for tps in while_pending["tps"] if tps["id"] == self.assigned_tps.id
        )
        self.assertEqual(approved_capacity["persentase_kapasitas"], 20)

        approved = self.client.post(
            f"/api/petugas-tps/monitoring-reports/{report_id}/approve"
        )
        self.assertEqual(approved.status_code, 200, approved.text)
        self.assertEqual(approved.json()["status"], "Disetujui")

        after_approval = self.client.get("/api/tps/warga").json()
        current_capacity = next(
            tps for tps in after_approval["tps"] if tps["id"] == self.assigned_tps.id
        )
        self.assertEqual(current_capacity["persentase_kapasitas"], 50)
        self.assertEqual(current_capacity["persentase_tersisa"], 50)
        self.assertEqual(current_capacity["volume_aktual_m3"], 5)

        second_decision = self.client.post(
            f"/api/petugas-tps/monitoring-reports/{report_id}/approve"
        )
        self.assertEqual(second_decision.status_code, 409)

    def test_monitoring_percentage_must_match_capacity(self):
        response = self.client.post(
            "/api/petugas-tps/monitoring-report",
            data={
                "tps_id": str(self.assigned_tps.id),
                "volume_aktual_m3": "5",
                "persentase_kapasitas": "80",
                "waktu_monitoring": "2025-01-04T08:00",
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_superadmin_assignment_rejects_tps_outside_officer_area(self):
        response = self.client.post(
            "/api/petugas-tps/assignments",
            json={
                "user_id": self.petugas.id,
                "tps_ids": [self.other_district_tps.id],
            },
        )
        self.assertEqual(response.status_code, 400)
        assignments = self.db.query(PetugasTPSAssignment).filter(
            PetugasTPSAssignment.user_id == self.petugas.id
        ).all()
        self.assertEqual([assignment.tps_id for assignment in assignments], [self.assigned_tps.id])

    def test_superadmin_can_assign_active_unmapped_tps_in_officer_district(self):
        response = self.client.post(
            "/api/petugas-tps/assignments",
            json={
                "user_id": self.petugas.id,
                "tps_ids": [self.unassigned_tps.id],
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        assignments = self.db.query(PetugasTPSAssignment).filter(
            PetugasTPSAssignment.user_id == self.petugas.id
        ).all()
        self.assertEqual(
            {assignment.tps_id for assignment in assignments},
            {self.assigned_tps.id, self.unassigned_tps.id},
        )

        inactive_response = self.client.post(
            "/api/petugas-tps/assignments",
            json={
                "user_id": self.petugas.id,
                "tps_ids": [self.inactive_tps.id],
            },
        )
        self.assertEqual(inactive_response.status_code, 400)

    def test_superadmin_user_creation_assigns_tps_atomically(self):
        response = self.client.post(
            "/api/admin/users",
            json={
                "username": "new-petugas-tps",
                "email": "new-petugas-tps@sipetasan.com",
                "password": "test-password",
                "nama_lengkap": "Petugas TPS Baru",
                "role": "petugas_tps",
                "wilayah_kecamatan": "Bubutan",
                "wilayah_kelurahan": "Tembok Dukuh",
                "tps_ids": [self.assigned_tps.id],
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        new_user_id = response.json()["id"]
        assignments = self.db.query(PetugasTPSAssignment).filter(
            PetugasTPSAssignment.user_id == new_user_id
        ).all()
        self.assertEqual([assignment.tps_id for assignment in assignments], [self.assigned_tps.id])

        rejected = self.client.post(
            "/api/admin/users",
            json={
                "username": "out-of-area",
                "email": "out-of-area@sipetasan.com",
                "password": "test-password",
                "nama_lengkap": "Petugas Salah Wilayah",
                "role": "petugas_tps",
                "wilayah_kecamatan": "Bubutan",
                "wilayah_kelurahan": "Tembok Dukuh",
                "tps_ids": [self.other_district_tps.id],
            },
        )
        self.assertEqual(rejected.status_code, 400)
        self.assertIsNone(
            self.db.query(User).filter(User.email == "out-of-area@sipetasan.com").first()
        )


if __name__ == "__main__":
    unittest.main()
