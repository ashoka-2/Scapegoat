import { useState, useEffect, useCallback } from "react";
import { getSellerAnalyticsApi } from "../../Products/Services/product.api.js";

export const useSellerAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: {
      totalOrders: 0,
      totalUnitsSold: 0,
      totalRevenue: 0,
      totalCost: 0,
      netProfit: 0,
      overallMargin: 0,
    },
    mostSoldProduct: null,
    mostProfitableProduct: null,
    dailyTrends: [],
    itemizedPerformance: [],
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resData = await getSellerAnalyticsApi();
      if (resData?.success) {
        setData(resData);
      }
    } catch (err) {
      console.error("Error fetching seller analytics:", err);
      setError(err.response?.data?.message || "Failed to load seller financial analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
