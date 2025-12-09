import React from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesRoutes } from '@/features/employees/routes';
import { handbookRoutes } from '@/features/handbook/routes';
import { contactsRoutes } from '@/features/contacts/routes';
import { accountRoutes } from '@/features/account/routes';

export const ConsolePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-5 py-0 pt-[96.19px]">
        {/* Trial Status Banner */}
        <div className="bg-white border border-[rgba(22,163,74,0.35)] rounded-[14px] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] px-[17px] py-[15px] mb-4 flex items-center justify-between gap-[14px]">
          <div className="flex-1">
            <p className="font-bold text-[16px] leading-[23.2px] text-green-600">
              ✅ Your free trial is active.{' '}
              <span className="font-normal text-[#0d0e0e]">
                You have 21 days remaining.
              </span>
            </p>
          </div>
          <div className="flex gap-[10px]">
            <button
              className="bg-gradient-to-b from-[#1a5948] to-[#44a083] text-white font-bold text-[16px] leading-[23.2px] px-[14px] py-[9px] rounded-[12px] underline"
              onClick={() => navigate(employeesRoutes.add)}
            >
              Invite Employees
            </button>
            <button className="bg-transparent border border-[#adcfc5] text-[#1a5948] font-bold text-[16px] leading-[23.2px] px-[15px] py-[10px] rounded-[12px] underline">
              Manage Billing
            </button>
          </div>
        </div>

        {/* Main Content - Cards Grid - 2 rows: 2 stretched cards on top, 3 normal cards on bottom */}
        <div className="grid grid-cols-6 gap-6 mb-8 items-stretch">
          {/* Row 1: Employees Card (spans 3 columns - fully stretched) */}
          <div className="col-span-3 bg-white border border-[rgba(255,255,255,0.06)] rounded-[14px] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] pt-[18px] pb-[19px] px-[19px] flex flex-col gap-[9px] h-full">
            <h3 className="font-bold text-[16px] leading-[23.2px] text-[#0d0e0e] tracking-[0.2px]">
              Employees
            </h3>
            <p className="font-normal text-[16px] leading-[23.2px] text-[#484b4b]">
              Add people, set roles, and manage access.
            </p>
            <button
              className="w-1/2 bg-[rgba(173,207,197,0.32)] border border-[rgba(26,89,72,0.35)] rounded-[10px] py-[13px] px-[13px] flex items-center justify-center"
              onClick={() => navigate(employeesRoutes.list)}
            >
              <span className="font-bold text-[16px] leading-[23.2px] text-[#1a5948] whitespace-nowrap">
                Go to Employees →
              </span>
            </button>
            <div className="flex flex-col gap-[10px] pt-px">
              <button
                className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between"
                onClick={() => navigate(employeesRoutes.add)}
              >
                <span className="font-normal text-[15.9px] leading-[23.2px] text-[#0d0e0e]">
                  Invite employees
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">
                  Roles & permissions
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
            </div>
          </div>

          {/* Row 1: Manage Handbook Card (spans 3 columns - fully stretched) */}
          <div className="col-span-3 bg-white border border-[rgba(255,255,255,0.06)] rounded-[14px] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] pt-[18px] pb-[19px] px-[19px] flex flex-col gap-[9px] h-full">
            <h3 className="font-bold text-[16px] leading-[23.2px] text-[#0d0e0e] tracking-[0.2px]">
              Manage Handbook
            </h3>
            <p className="font-normal text-[15.9px] leading-[23.2px] text-[#484b4b]">
              Create and publish your company handbook for employees.
            </p>
            <button
              className="w-1/2 bg-[rgba(173,207,197,0.35)] border border-[rgba(26,89,72,0.35)] rounded-[10px] py-[13px] px-[13px] flex items-center justify-center"
              onClick={() => navigate(handbookRoutes.list)}
            >
              <span className="font-bold text-[16px] leading-[23.2px] text-[#1a5948] whitespace-nowrap">
                Open Handbook →
              </span>
            </button>
            <div className="flex flex-col gap-[10px] pt-px">
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.9px] leading-[23.2px] text-[#0d0e0e]">
                  New handbook section
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.6px] leading-[23.2px] text-[#0d0e0e]">
                  Handbook settings
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
            </div>
          </div>

          {/* Row 2: Contacts Card (spans 2 columns - normal size) */}
          <div className="col-span-2 bg-white border border-[rgba(255,255,255,0.06)] rounded-[14px] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] pt-[18px] pb-[19px] px-[19px] flex flex-col gap-[9.1px] h-full">
            <h3 className="font-bold text-[16px] leading-[23.2px] text-[#0d0e0e] tracking-[0.2px]">
              Contacts
            </h3>
            <p className="font-normal text-[16px] leading-[23.2px] text-[#484b4b]">
              Store vendors, clients, and emergency contacts.
            </p>
            <button
              className="w-1/2 bg-[rgba(173,207,197,0.35)] border border-[rgba(26,89,72,0.35)] rounded-[10px] py-[13px] px-[13px] flex items-center justify-center"
              onClick={() => navigate(contactsRoutes.list)}
            >
              <span className="font-bold text-[16px] leading-[23.2px] text-[#1a5948] whitespace-nowrap">
                Manage Contacts →
              </span>
            </button>
            <div className="flex flex-col gap-[10px] pt-[0.89px]">
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.6px] leading-[23.2px] text-[#0d0e0e]">
                  Add contact
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">+</span>
              </button>
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">
                  Import CSV
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
            </div>
          </div>

          {/* Row 2: Account Card (spans 2 columns - normal size) */}
          <div className="col-span-2 bg-white border border-[rgba(255,255,255,0.06)] rounded-[14px] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] pt-[18px] pb-[19px] px-[19px] flex flex-col gap-[9px] h-full">
            <h3 className="font-bold text-[16px] leading-[23.2px] text-[#0d0e0e] tracking-[0.2px]">
              Account
            </h3>
            <p className="font-normal text-[16px] leading-[23.2px] text-[#484b4b]">
              Profile, security, and billing preferences.
            </p>
            <button
              className="w-1/2 bg-[rgba(173,207,197,0.35)] border border-[rgba(79,140,255,0.35)] rounded-[10px] py-[13px] px-[13px] flex items-center justify-center"
              onClick={() => navigate(accountRoutes.account)}
            >
              <span className="font-bold text-[16px] leading-[23.2px] text-[#1a5948] whitespace-nowrap">
                Open Account →
              </span>
            </button>
            <div className="flex flex-col gap-[10px] pt-px">
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.9px] leading-[23.2px] text-[#0d0e0e]">
                  Profile
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.8px] leading-[23.2px] text-[#0d0e0e]">
                  Billing
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">
                  Security
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">⇢</span>
              </button>
            </div>
          </div>

          {/* Row 2: Get Started Card (spans 2 columns - normal size) */}
          <div className="col-span-2 bg-white border border-[rgba(255,255,255,0.06)] rounded-[14px] shadow-[0px_12px_30px_0px_rgba(15,23,42,0.08)] pt-[18px] pb-[19px] px-[19px] flex flex-col gap-[9.1px] h-full">
            <h3 className="font-bold text-[16px] leading-[23.2px] text-[#0d0e0e] tracking-[0.2px]">
              Get Started
            </h3>
            <p className="font-normal text-[15.8px] leading-[23.2px] text-[#484b4b]">
              Recommended next steps to make the most of your trial.
            </p>
            <div className="flex flex-col gap-[10px] pt-[0.9px]">
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.8px] leading-[23.2px] text-[#0d0e0e]">
                  Invite your team
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">1</span>
              </button>
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.9px] leading-[23.2px] text-[#0d0e0e]">
                  Publish a handbook section
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">2</span>
              </button>
              <button className="bg-[rgba(209,222,218,0.12)] border border-[rgba(88,172,146,0.5)] rounded-[10px] py-[10px] px-[13px] flex items-center justify-between">
                <span className="font-normal text-[15.5px] leading-[23.2px] text-[#0d0e0e]">
                  Customize theme
                </span>
                <span className="font-normal text-[16px] leading-[23.2px] text-[#0d0e0e]">3</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

