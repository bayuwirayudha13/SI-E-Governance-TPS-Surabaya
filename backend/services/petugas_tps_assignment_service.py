from sqlalchemy.orm import Session
from typing import List, Optional
from models.petugas_tps_assignment import PetugasTPSAssignment
from schemas.petugas_tps_assignment_schema import PetugasTPSAssignmentCreate, PetugasTPSAssignmentUpdate

def get_all_petugas_tps_assignments(db: Session, skip: int = 0, limit: int = 100) -> List[PetugasTPSAssignment]:
    """Get all petugas_tps_assignments dengan pagination"""
    return db.query(PetugasTPSAssignment).offset(skip).limit(limit).all()

def get_petugas_tps_assignment_by_id(db: Session, assignment_id: int) -> Optional[PetugasTPSAssignment]:
    """Get petugas_tps_assignment by ID"""
    return db.query(PetugasTPSAssignment).filter(PetugasTPSAssignment.id == assignment_id).first()

def get_petugas_tps_assignments_by_user_id(db: Session, user_id: int) -> List[PetugasTPSAssignment]:
    """Get petugas_tps_assignments by user_id"""
    return db.query(PetugasTPSAssignment).filter(PetugasTPSAssignment.user_id == user_id).all()

def get_petugas_tps_assignments_by_tps_id(db: Session, tps_id: int) -> List[PetugasTPSAssignment]:
    """Get petugas_tps_assignments by tps_id"""
    return db.query(PetugasTPSAssignment).filter(PetugasTPSAssignment.tps_id == tps_id).all()

def create_petugas_tps_assignment(db: Session, assignment_data: PetugasTPSAssignmentCreate) -> PetugasTPSAssignment:
    """Create new petugas_tps_assignment"""
    db_assignment = PetugasTPSAssignment(**assignment_data.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def update_petugas_tps_assignment(db: Session, assignment_id: int, assignment_data: PetugasTPSAssignmentUpdate) -> Optional[PetugasTPSAssignment]:
    """Update petugas_tps_assignment"""
    db_assignment = db.query(PetugasTPSAssignment).filter(PetugasTPSAssignment.id == assignment_id).first()
    if not db_assignment:
        return None
    
    update_data = assignment_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assignment, field, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def delete_petugas_tps_assignment(db: Session, assignment_id: int) -> bool:
    """Delete petugas_tps_assignment"""
    db_assignment = db.query(PetugasTPSAssignment).filter(PetugasTPSAssignment.id == assignment_id).first()
    if not db_assignment:
        return False
    
    db.delete(db_assignment)
    db.commit()
    return True

def get_tps_assigned_to_user(db: Session, user_id: int) -> List[PetugasTPSAssignment]:
    """Get all TPS assigned to a specific user"""
    return db.query(PetugasTPSAssignment).filter(PetugasTPSAssignment.user_id == user_id).all()

def get_users_assigned_to_tps(db: Session, tps_id: int) -> List[PetugasTPSAssignment]:
    """Get all users assigned to a specific TPS"""
    return db.query(PetugasTPSAssignment).filter(PetugasTPSAssignment.tps_id == tps_id).all()

def remove_petugas_tps_assignment(db: Session, user_id: int, tps_id: int) -> bool:
    """Remove petugas_tps_assignment by user_id and tps_id"""
    assignment = db.query(PetugasTPSAssignment).filter(
        PetugasTPSAssignment.user_id == user_id,
        PetugasTPSAssignment.tps_id == tps_id
    ).first()
    
    if not assignment:
        return False
    
    db.delete(assignment)
    db.commit()
    return True