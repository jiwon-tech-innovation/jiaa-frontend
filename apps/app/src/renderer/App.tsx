import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import Signin from "./views/signin/Signin";
import Signup from "./views/signup/Signup";
import Dashboard from "./views/dashboard/Dashboard";
import { Statistics } from "./views/statistics/Statistics";
import RoadmapList from "./views/roadmap_list/RoadmapList";
import RoadmapView from "./views/roadmap/RoadmapView";
import Social from "./views/social/Social";
import Setting from "./views/setting/setting";
import Avatar from "./views/avatar/Avatar";
import AvatarSetting from "./views/avatar_setting/Avatar_setting";
import Avatar_select from "./views/avatar_select/avatr_select";
import FirstCreateLoadmap from "./views/first_create_loadmap/first_create_loadmap";
import ProfileView from "./views/profile/ProfileView";
import { MainLayout } from "./components/MainLayout/MainLayout";

export const App = () => {
    return (
        <HashRouter>
            <Routes>
                {/* Routes without MainLayout */}
                <Route path="/signin" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/first-create-loadmap" element={<FirstCreateLoadmap />} />

                {/* Routes with MainLayout (avatar persists) */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/roadmap-list" element={<RoadmapList />} />
                    <Route path="/roadmap/:id" element={<RoadmapView />} />
                    <Route path="/social" element={<Social />} />
                    <Route path="/setting" element={<Setting />} />
                    <Route path="/profile" element={<ProfileView />} />
                    <Route path="/avatar" element={<Avatar />} />
                    <Route path="/avatar-setting" element={<AvatarSetting />} />
                    <Route path="/avatar-select" element={<Avatar_select />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}