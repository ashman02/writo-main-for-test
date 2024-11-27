import axiosInstance from '@/utils/axiosInstance';
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import Loading from './ui/Loading';
import { useAppDispatch } from '@/redux/hooks';
import { setSubscriptions } from '@/redux/subscriptions';
import { useSelector } from 'react-redux';
import { SubscriptionState } from '@/types/all';

interface ApiResponse {
  data: {
    data: Quiz;
  };
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  id: string;
  name: string;
  duration: number;
  questions: Question[];
  isForFree: boolean;
  isForMentors: boolean;
}

const ServiceTest = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFree, setIsFree] = useState<boolean>(false);
  const [isMentorQuiz, setIsMentorQuiz] = useState<boolean>(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const dispatch = useAppDispatch();
  const subscriptions = useSelector((state: SubscriptionState) => state.subscriptions.subscriptions);
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  // Fetch user subscriptions
  const fetchSubscriptions = async () => {
    try {
      const response = await axiosInstance.get('/subscription/get-subscriptions?type=active');
      console.log(response)
      if (response.status === 200) {
        const serviceIds = response.data.data.map((subscription: { service: string }) => subscription.service);
        dispatch(setSubscriptions(serviceIds)); // Store only the IDs
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  // Fetch quiz details
  const fetchQuiz = async () => {
    try {
      const response = await axiosInstance.get<ApiResponse>(`/quiz/get-quiz/${quizId}`);
      const fetchedQuiz = response.data.data;
      setQuiz(fetchedQuiz);
      setIsFree(fetchedQuiz.isForFree);
      setIsMentorQuiz(fetchedQuiz.isForMentors);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSubscriptions(), fetchQuiz()]);
      setIsLoading(false);
    };
    fetchData();
  }, [dispatch, quizId]);

  useEffect(() => {
    if (isLoading || isFree || isMentorQuiz) return;
    // Check if the user is subscribed to the required service
    const requiredServiceId = quiz?.services[0]; // JEE Service ID
    const hasMatchingService = subscriptions.includes(requiredServiceId);

    if (!hasMatchingService) {
      navigate('/'); // Redirect if the user is not subscribed
    }
  }, [isLoading, isFree, isMentorQuiz, subscriptions, navigate]);

  if (isLoading) {
    return <Loading />;
  }

  return <Outlet />;
};

export default ServiceTest;
