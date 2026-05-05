import axiosInstance from '../api/axiosInstance';
import type {
    DashboardStatsResponse,
    AbcAnalysisDto,
    LocationUtilizationDto,
    HourlyActivityDto,
} from '../types';

export const dashboardService = {
    async getSummary(): Promise<DashboardStatsResponse> {
        const res = await axiosInstance.get<DashboardStatsResponse>('/Dashboard/summary');
        return res.data;
    },

    async getAbcAnalysis(): Promise<AbcAnalysisDto[]> {
        const res = await axiosInstance.get<AbcAnalysisDto[]>('/Dashboard/abc-analysis');
        return res.data;
    },

    async getUtilization(): Promise<LocationUtilizationDto[]> {
        const res = await axiosInstance.get<LocationUtilizationDto[]>('/Dashboard/utilization');
        return res.data;
    },

    async getHeatmap(): Promise<HourlyActivityDto[]> {
        const res = await axiosInstance.get<HourlyActivityDto[]>('/Dashboard/activity-heatmap');
        return res.data;
    },
};