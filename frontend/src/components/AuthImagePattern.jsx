const AuthImagePattern = ({ title, subtitle }) => {
    return (
        <div className="hidden lg:flex items-center justify-center bg-base-200 p-12 relative overflow-hidden">
            <style>{`
                @keyframes pulse-ring {
                    0%   { transform: scale(0.55); opacity: 0.75; }
                    100% { transform: scale(2.5);  opacity: 0; }
                }
                @keyframes pulse-core {
                    0%, 100% { transform: scale(1);    }
                    50%      { transform: scale(1.08); }
                }
                @keyframes float-a {
                    0%, 100% { transform: translateY(0px)  translateX(0px); }
                    50%      { transform: translateY(-13px) translateX(4px); }
                }
                @keyframes float-b {
                    0%, 100% { transform: translateY(0px) translateX(0px);  }
                    50%      { transform: translateY(11px) translateX(-7px); }
                }
                @keyframes float-c {
                    0%, 100% { transform: translateY(0px)  translateX(0px); }
                    50%      { transform: translateY(-9px)  translateX(8px); }
                }
                @keyframes blink-dot {
                    0%, 100% { opacity: 1;   }
                    50%      { opacity: 0.3; }
                }
            `}</style>

            <div className="max-w-sm text-center">
                {/* Animated hero section — pulse rings, centre orb, and floating chat bubbles */}
                <div
                    className="relative flex items-center justify-center mb-10"
                    style={{ height: "260px" }}
                >
                    {/* Radiating pulse rings */}
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="absolute w-24 h-24 rounded-full border-2 border-primary/50"
                            style={{
                                animation: "pulse-ring 3s ease-out infinite",
                                animationDelay: `${i * 0.75}s`,
                            }}
                        />
                    ))}

                    {/* Centre orb */}
                    <div
                        className="relative z-10 w-[88px] h-[88px] rounded-full
                                   bg-primary/10 border-2 border-primary/30
                                   flex items-center justify-center"
                        style={{ animation: "pulse-core 2s ease-in-out infinite" }}
                    >
                        <div
                            className="w-16 h-16 rounded-full bg-primary/20
                                       flex items-center justify-center"
                        >
                            {/* Heartbeat / waveform icon */}
                            <svg
                                width="42"
                                height="26"
                                viewBox="0 0 42 26"
                                fill="none"
                                className="text-primary"
                            >
                                <polyline
                                    points="0,13 7,13 11,2 15,24 19,9 23,17 27,13 42,13"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Floating chat bubbles that drift around the centre orb */}

                    {/* Top-right — incoming */}
                    <div
                        className="absolute top-[8%] right-[4%]
                                   bg-base-100 border border-base-300
                                   rounded-2xl rounded-tr-sm
                                   px-3 py-2 shadow-md text-xs font-medium
                                   flex items-center gap-1.5 whitespace-nowrap"
                        style={{ animation: "float-a 4.2s ease-in-out infinite" }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-green-500"
                            style={{ animation: "blink-dot 1.4s ease-in-out infinite" }}
                        />
                        Hey there! 👋
                    </div>

                    {/* Bottom-left — outgoing (primary colour) */}
                    <div
                        className="absolute bottom-[18%] left-[2%]
                                   bg-primary text-primary-content
                                   rounded-2xl rounded-tl-sm
                                   px-3 py-2 shadow-md text-xs font-medium
                                   whitespace-nowrap"
                        style={{ animation: "float-b 5.5s ease-in-out infinite" }}
                    >
                        What&apos;s up? 😊
                    </div>

                    {/* Mid-right — status */}
                    <div
                        className="absolute top-[54%] right-[2%]
                                   bg-base-100 border border-base-300
                                   rounded-2xl rounded-br-sm
                                   px-3 py-1.5 shadow-md text-xs font-medium
                                   flex items-center gap-1.5 whitespace-nowrap"
                        style={{ animation: "float-c 3.8s ease-in-out infinite" }}
                    >
                        <span className="text-primary font-bold">✓✓</span> Seen
                    </div>

                    {/* Small accent dots scattered around to add depth to the animation */}
                    <div
                        className="absolute top-[7%] left-[24%] w-2 h-2 rounded-full bg-primary/50"
                        style={{ animation: "float-a 3s ease-in-out infinite" }}
                    />
                    <div
                        className="absolute bottom-[8%] left-[68%] w-1.5 h-1.5 rounded-full bg-primary/40"
                        style={{
                            animation: "float-b 4s ease-in-out infinite",
                            animationDelay: "0.6s",
                        }}
                    />
                    <div
                        className="absolute top-[76%] left-[10%] w-1.5 h-1.5 rounded-full bg-primary/40"
                        style={{
                            animation: "float-c 3.5s ease-in-out infinite",
                            animationDelay: "1.2s",
                        }}
                    />
                </div>

                {/* Title and subtitle passed in as props from the login/signup page */}
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <p className="text-base-content/60">{subtitle}</p>
            </div>
        </div>
    );
};

export default AuthImagePattern;