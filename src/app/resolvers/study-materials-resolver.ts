import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ApiServices, StudentLookupResponse, StudyMaterialResponse } from '../services/api-services';

export interface StudyMaterialsResolvedData {
    materials: StudyMaterialResponse[];
    selectedMaterial: StudyMaterialResponse | null;
    students: StudentLookupResponse[];
}

export const studyMaterialsResolver: ResolveFn<StudyMaterialsResolvedData> = async (route) => {
    const api = inject(ApiServices);
    const materials = await api.getStudyMaterials();
    const selectedMaterialId = Number(route.paramMap.get('id'));
    const selectedMaterial = Number.isFinite(selectedMaterialId) && selectedMaterialId > 0
        ? await api.getStudyMaterial(selectedMaterialId)
        : null;

    const students = api.isAdmin()
        ? await api.getStudents()
        : [];

    return {
        materials,
        selectedMaterial,
        students
    };
};