'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Layout, Button, Avatar, Dropdown, Space, Badge } from 'antd';
import { 
  HomeOutlined, 
  LineChartOutlined, 
  ExperimentOutlined, 
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { integratedPlatformColors } from '../../../lib/integrated-theme';

const { Header } = Layout;

interface NavigationProps {
  currentPath?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}
